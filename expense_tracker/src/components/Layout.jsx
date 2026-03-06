import { Plus } from 'lucide-react';
import BottomNav from './BottomNav';

export default function Layout({ children, activeTab, setActiveTab, onAddTransaction }) {
    return (
        <div className="h-[100dvh] w-full flex justify-center bg-[#1a1a1a]">
            <div
                className="w-full max-w-md h-full bg-cream shadow-2xl relative flex flex-col overflow-hidden"
            >
                {/* Elegant Background Pattern */}
                <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#d4c5b0,transparent_70%)]"></div>
                    <div className="absolute top-0 left-0 right-0 h-64 bg-[linear-gradient(to_bottom,#e6e2d3,transparent)]"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
                </div>

                <main className="flex-1 overflow-y-auto relative z-10 scrollbar-hide">
                    {children}
                </main>

                <button
                    onClick={onAddTransaction}
                    className="absolute bottom-24 right-6 z-50 bg-nature-800 text-cream p-4 rounded-full shadow-2xl hover:bg-nature-900 transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-nature-100 border-2 border-cream/50"
                    aria-label="Add Transaction"
                >
                    <Plus className="w-8 h-8" />
                </button>

                <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />


            </div>
        </div>
    );
}
