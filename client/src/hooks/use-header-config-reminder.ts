import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

const STORAGE_KEY = "vv:hide-header-config-reminder";
const EVENT_NAME = "vitaview:document-generated";

/** Dispatched by document-generation flows (receitas, atestados) on success. */
export function notifyDocumentGenerated() {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(EVENT_NAME));
    }
}

interface ClinicHeader {
    headerMode?: "minimal" | "image" | "composed";
}

/**
 * Reminder dialog state for "personalize seu cabeçalho". Shows only while the
 * clinic is still on the default minimal letterhead AND the user has not
 * dismissed the message permanently.
 */
export function useHeaderConfigReminder() {
    const [open, setOpen] = useState(false);

    const { data: header } = useQuery<ClinicHeader>({
        queryKey: ["/api/clinics/header/active"],
        staleTime: 60_000,
    });

    const isMinimal = !header?.headerMode || header.headerMode === "minimal";
    const isDismissed = typeof window !== "undefined"
        && window.localStorage.getItem(STORAGE_KEY) === "1";

    const trigger = useCallback(() => {
        if (!isDismissed && isMinimal) {
            setOpen(true);
        }
    }, [isDismissed, isMinimal]);

    // Auto-trigger whenever the app dispatches the document-generated event.
    useEffect(() => {
        const handler = () => trigger();
        window.addEventListener(EVENT_NAME, handler);
        return () => window.removeEventListener(EVENT_NAME, handler);
    }, [trigger]);

    const dismissForever = useCallback(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, "1");
        } catch {
            /* ignore */
        }
        setOpen(false);
    }, []);

    return { open, setOpen, trigger, dismissForever };
}
