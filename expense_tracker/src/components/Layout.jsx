import { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, X, ArrowUpCircle, ArrowDownCircle, HandCoins } from 'lucide-react';
import BottomNav from './BottomNav';

export default function Layout({ children, activeTab, setActiveTab, onAddTransaction, isWarning }) {
    const [fabExpanded, setFabExpanded] = useState(false);
    const [ripple, setRipple] = useState(false);
    const [fabVisible, setFabVisible] = useState(true);
    const timerRef = useRef(null);
    const isLongPressRef = useRef(false);
    const mainRef = useRef(null);
    const lastScrollYRef = useRef(0);

    useEffect(() => {
        const el = mainRef.current;
        if (!el) return;
        const handleScroll = () => {
            const currentY = el.scrollTop;
            const delta = currentY - lastScrollYRef.current;
            if (Math.abs(delta) < 8) return;
            if (currentY < 80) {
                setFabVisible(true);
            } else if (delta > 0) {
                setFabVisible(false);
            } else {
                setFabVisible(true);
            }
            lastScrollYRef.current = currentY;
        };
        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, []);

    const handleStart = useCallback((e) => {
        e.preventDefault();
        isLongPressRef.current = false;
        setRipple(true);
        timerRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            setFabExpanded(true);
            setRipple(false);
        }, 500);
    }, []);

    const handleEnd = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setRipple(false);
        if (!isLongPressRef.current) {
            onAddTransaction('expense');
        }
    }, [onAddTransaction]);

    const handleCancel = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setRipple(false);
    }, []);

    const handleMiniSelect = (type) => {
        setFabExpanded(false);
        onAddTransaction(type);
    };

    // Close expanded FAB on outside click
    useEffect(() => {
        if (!fabExpanded) return;
        const handler = (e) => {
            if (e.target.closest('.fab-zone')) return;
            setFabExpanded(false);
        };
        document.addEventListener('pointerdown', handler);
        return () => document.removeEventListener('pointerdown', handler);
    }, [fabExpanded]);

    const accentBg = isWarning ? 'bg-[var(--theme-accent-800)]' : 'bg-nature-800';
    const accentHover = isWarning ? 'hover:bg-[var(--theme-accent-900)]' : 'hover:bg-nature-900';

    const miniButtons = [
        { type: 'expense', label: 'Expense', icon: ArrowUpCircle, color: 'bg-red-500', x: -85, y: -45 },
        { type: 'income', label: 'Income', icon: ArrowDownCircle, color: 'bg-green-600', x: -40, y: -85 },
        { type: 'lent', label: 'Lent', icon: HandCoins, color: 'bg-amber-500', x: 10, y: -45 },
    ];

    return (
        <div className="h-[100dvh] w-full flex justify-center bg-[#1a1a1a]">
            <div className="w-full max-w-md h-full bg-cream shadow-2xl relative flex flex-col">
                {/* Elegant Background Pattern */}
                <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#d4c5b0,transparent_70%)]"></div>
                    <div className="absolute top-0 left-0 right-0 h-64 bg-[linear-gradient(to_bottom,#e6e2d3,transparent)]"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
                </div>

                <main ref={mainRef} className="flex-1 overflow-y-auto relative z-10 scrollbar-hide">
                    {children}
                </main>

                {/* FAB Zone */}
                <div
                    className={`fab-zone absolute bottom-24 right-6 z-50 transition-all duration-300 ease-out ${
                        fabVisible || fabExpanded
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-12 pointer-events-none'
                    }`}
                >
                    {/* Expanded mini-buttons - positioned relative to FAB center */}
                    {fabExpanded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            {/* Overlay for dimming */}
                            <div className="fixed inset-0 bg-black/20" style={{ zIndex: -1 }} />
                            {miniButtons.map((btn, i) => (
                                <button
                                    key={btn.type}
                                    onClick={() => handleMiniSelect(btn.type)}
                                    className="absolute flex flex-col items-center gap-1 animate-fab-pop"
                                    style={{
                                        transform: `translate(${btn.x}px, ${btn.y}px)`,
                                        animationDelay: `${i * 0.06}s`,
                                        animationFillMode: 'both',
                                    }}
                                >
                                    <div className={`${btn.color} text-white p-3 rounded-full shadow-xl`}>
                                        <btn.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold text-nature-900 bg-white/90 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                                        {btn.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Main FAB */}
                    <button
                        onMouseDown={handleStart}
                        onMouseUp={handleEnd}
                        onMouseLeave={handleCancel}
                        onTouchStart={handleStart}
                        onTouchEnd={handleEnd}
                        onTouchCancel={handleCancel}
                        className={`relative ${accentBg} ${accentHover} text-cream p-4 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-nature-100 border-2 border-cream/50 theme-transition overflow-hidden select-none`}
                        aria-label="Add Transaction"
                    >
                        {ripple && (
                            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="w-12 h-12 rounded-full bg-white/30 animate-ripple" />
                            </span>
                        )}
                        {fabExpanded ? <X className="w-8 h-8 relative z-10" /> : <Plus className="w-8 h-8 relative z-10" />}
                    </button>
                </div>

                <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} isWarning={isWarning} />
            </div>
        </div>
    );
}
