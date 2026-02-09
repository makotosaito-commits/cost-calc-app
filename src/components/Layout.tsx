import React from 'react';
import { BottomNav } from './BottomNav';

interface LayoutProps {
    children: React.ReactNode;
    currentView: 'menus' | 'materials' | 'settings';
    onChangeView: (view: 'menus' | 'materials' | 'settings') => void;
}

export const Layout = ({ children, currentView, onChangeView }: LayoutProps) => {
    const maxWidthClass = currentView === 'settings' ? 'max-w-5xl' : 'max-w-7xl';

    return (
        <div className="min-h-dvh bg-background text-foreground flex flex-col font-sans selection:bg-primary/10">
            <main className={`flex-1 w-full ${maxWidthClass} mx-auto px-3 md:px-5 pt-1 md:pt-4 pb-6 md:pb-8 mb-20 md:mb-20 animate-in`}>
                <div className="space-y-4 md:space-y-8">
                    {children}
                </div>
            </main>
            <BottomNav currentView={currentView} onChange={onChangeView} />
        </div>
    );
};
