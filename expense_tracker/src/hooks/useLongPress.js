import { useRef, useCallback } from 'react';

export function useLongPress(onLongPress, onClick, delay = 500) {
    const timerRef = useRef(null);
    const isLongPressRef = useRef(false);

    const start = useCallback((e) => {
        e.preventDefault();
        isLongPressRef.current = false;
        timerRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            onLongPress();
        }, delay);
    }, [onLongPress, delay]);

    const stop = useCallback((e) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (!isLongPressRef.current) {
            onClick();
        }
    }, [onClick]);

    const cancel = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    return {
        onMouseDown: start,
        onMouseUp: stop,
        onMouseLeave: cancel,
        onTouchStart: start,
        onTouchEnd: stop,
        onTouchCancel: cancel,
    };
}
