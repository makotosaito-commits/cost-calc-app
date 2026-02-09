import React from 'react';
import { BottomNav } from './BottomNav';

interface LayoutProps {
    children: React.ReactNode;
    currentView: 'menus' | 'materials' | 'settings';
    onChangeView: (view: 'menus' | 'materials' | 'settings') => void;
}

export const Layout = ({ children, currentView, onChangeView }: LayoutProps) => {
    const maxWidthClass = currentView === 'menus' ? 'max-w-7xl' : 'max-w-5xl';

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/10">
            <main className={`flex-1 w-full ${maxWidthClass} mx-auto px-4 pt-3 pb-8 md:py-6 mb-20 animate-in`}>
                <div className="space-y-8">
                    {children}
                </div>
            </main>
            <BottomNav currentView={currentView} onChange={onChangeView} />
        </div>
    );
};
