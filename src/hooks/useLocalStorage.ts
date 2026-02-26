"use client";

import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, defaultValue: T) {
    const [value, setValue] = useState<T>(defaultValue);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(key);
            if (raw != null) {
                setValue(JSON.parse(raw));
            }
        } catch {
            setValue(defaultValue);
        } finally {
            setHydrated(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    useEffect(() => {
        if (!hydrated) return;
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // ignore
        }
    }, [hydrated, key, value]);

    return [value, setValue, hydrated] as const;
}

