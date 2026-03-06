import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';

export default function ConfirmationDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDestructive = false }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className={cn(
                    "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />
            <div
                className={cn(
                    "relative w-full max-w-sm bg-cream rounded-3xl shadow-2xl p-6 overflow-hidden transition-all duration-300 transform",
                    isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
                )}
            >
                {/* Decorative background element pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,#d4c5b0,transparent_70%)] opacity-30 pointer-events-none"></div>

                <div className="flex justify-between items-start mb-4 relative z-10">
                    <h2 className="text-xl font-bold text-nature-900 font-serif">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-nature-400 hover:text-nature-700 hover:bg-nature-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-nature-700 text-sm mb-6 relative z-10 leading-relaxed">
                    {message}
                </p>

                <div className="flex gap-3 relative z-10">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm text-nature-700 bg-sand/30 hover:bg-sand/60 transition-colors border border-nature-200/50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={cn(
                            "flex-1 py-2.5 px-4 rounded-xl font-bold text-sm text-white shadow-md transition-all hover:shadow-lg active:scale-95",
                            isDestructive
                                ? "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                                : "bg-nature-800 hover:bg-nature-900 shadow-nature-800/20"
                        )}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
