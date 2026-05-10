
import React from 'react';
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

        return (
            <div
                ref={ref}
                {...props}
                className={cn(
                    "relative inline-block opacity-70 grayscale-[0.3]",
                    (props as React.HTMLAttributes<HTMLDivElement>).className
                )}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <div className="pointer-events-none w-full">
                    {children}
                </div>

                {hovered && (
                    <div
                        className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-xl border border-white/10 bg-charcoal/95 p-4 shadow-2xl backdrop-blur-sm"
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                        style={{ pointerEvents: 'all' }}
                    >
                        <div className="mb-3 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/20">
                                <Lock className="h-4 w-4 text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">Recurso Premium</p>
                                <p className="text-xs text-white/60">Plano atual não inclui</p>
                            </div>
                        </div>
                        <p className="mb-4 text-xs leading-relaxed text-white/80">
                            A funcionalidade <strong className="text-white">Evolução</strong> está disponível exclusivamente nos planos <strong className="text-yellow-400">Vita</strong>. Faça upgrade para desbloquear.
                        </p>
                        <Button
                            size="sm"
                            className="w-full bg-yellow-500 text-charcoal hover:bg-yellow-400 font-semibold"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setLocation('/subscription');
                            }}
                        >
                            Fazer Upgrade
                        </Button>
                    </div>
                )}
            </div>
        );
    }
);
FeatureGate.displayName = 'FeatureGate';
