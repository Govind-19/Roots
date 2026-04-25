import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Undo2 } from 'lucide-react';

const UndoToastContext = createContext({ show: () => {} });

export function useUndoToast() {
    return useContext(UndoToastContext);
}

export function UndoToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef(new Map());

    const dismiss = useCallback((id) => {
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const show = useCallback(({ message, onUndo, duration = 5000 }) => {
        const id = crypto.randomUUID();
        setToasts(prev => [...prev, { id, message, onUndo }]);
        const timer = setTimeout(() => {
            timersRef.current.delete(id);
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
        timersRef.current.set(id, timer);
        return id;
    }, []);

    useEffect(() => () => {
        timersRef.current.forEach(t => clearTimeout(t));
        timersRef.current.clear();
    }, []);

    return (
        <UndoToastContext.Provider value={{ show, dismiss }}>
            {children}
            {createPortal(
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[10000] flex flex-col items-center gap-2 pointer-events-none">
                    {toasts.map(t => (
                        <div
                            key={t.id}
                            className="pointer-events-auto flex items-center gap-3 bg-nature-900 text-cream px-4 py-3 rounded-2xl shadow-2xl border border-nature-700 max-w-[90vw] animate-toast-in"
                        >
                            <span className="text-sm font-medium">{t.message}</span>
                            {t.onUndo && (
                                <button
                                    onClick={() => { t.onUndo(); dismiss(t.id); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cream text-nature-900 rounded-xl text-xs font-bold hover:bg-white active:scale-95 transition-all"
                                >
                                    <Undo2 className="w-3.5 h-3.5" /> Undo
                                </button>
                            )}
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </UndoToastContext.Provider>
    );
}
