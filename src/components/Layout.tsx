import React from 'react';
import { BottomNav } from './BottomNav';

interface LayoutProps {
    children: React.ReactNode;
    currentView: 'menus' | 'materials' | 'settings';
    onChangeView: (view: 'menus' | 'materials' | 'settings') => void;
}

export const Layout = ({ children, currentView, onChangeView }: LayoutProps) => {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/10">
            <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 md:py-12 mb-20 animate-in">
                <div className="space-y-8">
                    {children}
                </div>
            </main>
            <BottomNav currentView={currentView} onChange={onChangeView} />
        </div>
    );
};
