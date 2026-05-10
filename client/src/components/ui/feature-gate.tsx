
import React from 'react';
import ReactDOM from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useLocation } from "wouter";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

interface FeatureGateProps {
    children: React.ReactNode;
    feature?: string; // Optional feature name for analytics/logging
}

// Reuse the interface from subscription page (defining locally or importing if available)
interface Subscription {
    status: string;
    planId: number;
    currentPeriodEnd?: string | Date | null;
}
interface SubscriptionPlan {
    name: string;
    id: number;
}
interface UserSubscription {
    subscription: Subscription | null;
    plan: SubscriptionPlan | null;
}

const normalizePlanName = (name?: string | null) =>
    (name ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

const isPaidPlan = (plan?: SubscriptionPlan | null) => {
    const planName = normalizePlanName(plan?.name);

    if (!planName || planName === "gratuito") {
        return false;
    }

    return planName.includes("vita") || planName !== "gratuito";
};

const isSubscriptionUsable = (subscription?: Subscription | null) => {
    if (!subscription) {
        return false;
    }

    const status = subscription.status?.toLowerCase();
    const hasAccessStatus = status === "active" || status === "trialing";

    if (!hasAccessStatus) {
        return false;
    }

    if (!subscription.currentPeriodEnd) {
        return true;
    }

    const periodEnd = new Date(subscription.currentPeriodEnd);
    return Number.isNaN(periodEnd.getTime()) || periodEnd > new Date();
};

export const FeatureGate = React.forwardRef<HTMLDivElement, FeatureGateProps>(
    ({ children, feature: _feature, ...props }, ref) => {
        const [, setLocation] = useLocation();
        const [hovered, setHovered] = React.useState(false);
        const [tooltipPos, setTooltipPos] = React.useState({ top: 0, left: 0 });
        const wrapperRef = React.useRef<HTMLDivElement>(null);
        const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
        const { data: subscriptionData, isLoading } = useQuery<UserSubscription>({
            queryKey: ['/api/user-subscription'],
            staleTime: 5 * 60 * 1000,
        });

        const hasPremiumAccess =
            isSubscriptionUsable(subscriptionData?.subscription) &&
            isPaidPlan(subscriptionData?.plan);

        if (hasPremiumAccess || isLoading) {
            if (isLoading) return <Slot ref={ref} {...props}>{children}</Slot>;
            return <Slot ref={ref} {...props}>{children}</Slot>;
        }

        const cancelHide = () => {
            if (hideTimer.current) {
                clearTimeout(hideTimer.current);
                hideTimer.current = null;
            }
        };

        const scheduleHide = () => {
            hideTimer.current = setTimeout(() => setHovered(false), 100);
        };

        const handleMouseEnter = () => {
            cancelHide();
            if (wrapperRef.current) {
                const rect = wrapperRef.current.getBoundingClientRect();
                setTooltipPos({
                    top: rect.bottom + window.scrollY + 8,
                    left: rect.left + window.scrollX + rect.width / 2,
                });
            }
            setHovered(true);
        };

        const tooltip = hovered && ReactDOM.createPortal(
            <div
                className="fixed z-[9999] w-72 rounded-xl border border-white/10 bg-black p-5 shadow-2xl"
                style={{
                    top: tooltipPos.top,
                    left: tooltipPos.left,
                    transform: 'translateX(-50%)',
                    position: 'absolute',
                }}
                onMouseEnter={cancelHide}
                onMouseLeave={scheduleHide}
            >
                <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                        <Lock className="h-4 w-4 text-yellow-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">Recurso Premium</p>
                        <p className="text-xs text-white/50">Disponível nos planos Vita</p>
                    </div>
                </div>
                <p className="mb-4 text-xs leading-relaxed text-white/70">
                    Faça upgrade do seu plano para desbloquear a funcionalidade <strong className="text-white">Evolução</strong> e outros recursos exclusivos.
                </p>
                <Button
                    size="sm"
                    className="w-full bg-white text-black hover:bg-white/90 font-semibold"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setLocation('/subscription');
                    }}
                >
                    Fazer Upgrade
                </Button>
            </div>,
            document.body
        );

        return (
            <>
                <div
                    ref={(node) => {
                        (wrapperRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
                        if (typeof ref === 'function') ref(node);
                        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
                    }}
                    {...props}
                    className={cn(
                        "relative inline-block opacity-70 grayscale-[0.3] cursor-pointer",
                        (props as React.HTMLAttributes<HTMLDivElement>).className
                    )}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={scheduleHide}
                >
                    <div className="pointer-events-none w-full">
                        {children}
                    </div>
                </div>
                {tooltip}
            </>
        );
    }
);
FeatureGate.displayName = 'FeatureGate';
