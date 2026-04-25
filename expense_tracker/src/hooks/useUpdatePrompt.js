import { useEffect, useState } from 'react';

const POLL_INTERVAL = 5 * 60 * 1000;

export function useUpdatePrompt() {
    const [updateAvailable, setUpdateAvailable] = useState(false);

    useEffect(() => {
        if (import.meta.env.DEV) return;

        let cancelled = false;

        const check = async () => {
            try {
                const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled && data?.version && data.version !== __APP_VERSION__) {
                    setUpdateAvailable(true);
                }
            } catch {
                /* offline or 404 — ignore */
            }
        };

        check();
        const interval = setInterval(check, POLL_INTERVAL);
        const onVisible = () => {
            if (document.visibilityState === 'visible') check();
        };
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            cancelled = true;
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, []);

    return updateAvailable;
}
