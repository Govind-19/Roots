import { RefreshCw } from 'lucide-react';
import { useUpdatePrompt } from '../hooks/useUpdatePrompt';

export default function UpdateBanner() {
    const updateAvailable = useUpdatePrompt();
    if (!updateAvailable) return null;

    return (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-nature-900 text-cream px-4 py-3 rounded-2xl shadow-2xl border border-nature-700 animate-modal-up">
            <span className="text-sm font-medium">A new version is available</span>
            <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cream text-nature-900 rounded-xl text-xs font-bold hover:bg-white active:scale-95 transition-all"
            >
                <RefreshCw className="w-3.5 h-3.5" /> Reload
            </button>
        </div>
    );
}
