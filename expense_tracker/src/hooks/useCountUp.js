import { useState, useEffect, useRef } from 'react';

export function useCountUp(target, duration = 600) {
    const [value, setValue] = useState(target);
    const prevRef = useRef(target);
    const frameRef = useRef(null);

    useEffect(() => {
        const prev = prevRef.current;
        if (prev === target) return;

        const startTime = performance.now();
        const diff = target - prev;

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(prev + diff * eased);

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            } else {
                setValue(target);
                prevRef.current = target;
            }
        };

        frameRef.current = requestAnimationFrame(animate);
        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, [target, duration]);

    // Update ref when target changes (after animation completes)
    useEffect(() => {
        return () => { prevRef.current = target; };
    }, [target]);

    return value;
}
