import { Home, PieChart, History, Users } from 'lucide-react';
import { cn } from '../lib/utils';

export default function BottomNav({ activeTab, setActiveTab }) {
    const navItems = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'analytics', icon: PieChart, label: 'Insights' },
        { id: 'history', icon: History, label: 'History' },
        { id: 'people', icon: Users, label: 'Pack' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-cream/90 backdrop-blur-md border-t border-sand pb-safe z-40">
            <div className="flex justify-around items-center h-20 px-4 max-w-md mx-auto">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300",
                            activeTab === item.id ? "text-nature-800 -translate-y-1" : "text-earth-600 hover:text-nature-700"
                        )}
                    >
                        <item.icon className={cn("w-6 h-6", activeTab === item.id && "fill-current")} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                        <span className={cn("text-[10px] font-bold tracking-widest uppercase", activeTab === item.id ? "opacity-100" : "opacity-0")}>{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}
