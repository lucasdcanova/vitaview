import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface MyClinicResponse {
    clinic?: { id: number; name?: string | null } | null;
}

function clinicIsConfigured(clinic: MyClinicResponse["clinic"], user: any): boolean {
    if (!clinic) return false;
    if (!user?.street) return false;
    return true;
}

export function useClinicSetupReminder() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);

    const { data: clinicData, isLoading } = useQuery<MyClinicResponse>({
        queryKey: ["/api/my-clinic", user?.id ?? null, user?.clinicId ?? null],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/my-clinic");
            return res.json();
        },
        enabled: !!user,
        staleTime: 60_000,
    });

    useEffect(() => {
        if (!user || isLoading || !clinicData) return;
        if (clinicIsConfigured(clinicData.clinic, user)) return;

        const prefs = (user.preferences as any) ?? {};
        const dismissedAt = prefs.clinicSetupReminderDismissedAt;
        if (dismissedAt) {
            const ts = new Date(dismissedAt).getTime();
            if (!Number.isNaN(ts) && Date.now() - ts < DISMISS_TTL_MS) return;
        }

        const t = setTimeout(() => setOpen(true), 1200);
        return () => clearTimeout(t);
    }, [user, clinicData, isLoading]);

    const dismiss = useCallback(async () => {
        setOpen(false);
        try {
            await apiRequest("PATCH", "/api/user/preferences", {
                preferences: { clinicSetupReminderDismissedAt: new Date().toISOString() },
            });
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        } catch (e) {
            console.error("Failed to persist clinic reminder dismissal:", e);
        }
    }, []);

    return { open, setOpen, dismiss };
}
