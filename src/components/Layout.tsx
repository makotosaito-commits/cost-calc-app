import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export const Layout = () => {
    const { pathname } = useLocation();
    const maxWidthClass = pathname.startsWith('/settings') ? 'max-w-5xl' : 'max-w-7xl';
    const mainBottomSpacingClass = pathname.startsWith('/menu')
        ? 'pb-6 md:pb-6 mb-20 md:mb-16'
        : 'pb-6 md:pb-8 mb-20 md:mb-20';

    return (
        <div className="min-h-dvh bg-background text-foreground flex flex-col font-sans selection:bg-primary/10">
            <main className={`flex-1 w-full ${maxWidthClass} ${mainBottomSpacingClass} mx-auto px-3 md:px-5 pt-1 md:pt-4 animate-in`}>
                <div className="space-y-4 md:space-y-8">
                    <Outlet />
                </div>
            </main>
            <BottomNav />
        </div>
    );
};
