import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Toast({ message, type = 'warning', duration = 3000, onDone }) {
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLeaving(true);
            setTimeout(() => onDone?.(), 300);
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onDone]);

    const bgColor = type === 'warning' ? 'bg-amber-600' : type === 'error' ? 'bg-red-600' : 'bg-green-700';

    return createPortal(
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[10000] ${leaving ? 'animate-toast-out' : 'animate-toast-in'}`}>
            <div className={`${bgColor} text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold max-w-[90vw]`}>
                {message}
            </div>
        </div>,
        document.body
    );
}
