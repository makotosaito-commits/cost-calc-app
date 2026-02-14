import { useEffect, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { MaterialForm } from './components/MaterialForm';
import { MaterialList } from './components/MaterialList';
import { MenuPage } from './components/MenuPage';
import { SettingsPage } from './components/SettingsPage';
import { AuthPage } from './components/AuthPage';
import { Layout } from './components/Layout';
import { db } from './lib/db';
import { supabase } from './lib/supabase';
import { Material } from './types';

type AppView = 'menus' | 'materials' | 'settings';
const LAST_VIEW_KEY = 'costcalc:lastView';
const POST_AUTH_FROM_KEY = 'costcalc:postAuthView';

const isAppView = (value: string | null): value is AppView => (
    value === 'menus' || value === 'materials' || value === 'settings'
);

const consumePostAuthView = (): string | null => {
    const from = window.localStorage.getItem(POST_AUTH_FROM_KEY);
    window.localStorage.removeItem(POST_AUTH_FROM_KEY);
    return from;
};

const resolvePostAuthView = (fromView: string | null): AppView => {
    if (isAppView(fromView)) {
        return fromView;
    }
    return 'menus';
};

function App() {
    const [view, setView] = useState<AppView>('menus');
    const [session, setSession] = useState<Session | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const currentUserIdRef = useRef<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            const { data, error } = await supabase.auth.getSession();
            if (!mounted) return;
            if (error) {
                setAuthError(error.message);
            }
            setSession(data.session);
            currentUserIdRef.current = data.session?.user?.id ?? null;
            setView(data.session ? resolvePostAuthView(consumePostAuthView()) : 'menus');
            setAuthLoading(false);
        };

        initializeAuth();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            const nextUserId = nextSession?.user?.id ?? null;
            const previousUserId = currentUserIdRef.current;
            if (previousUserId !== nextUserId) {
                void db.transaction('rw', db.menus, db.recipes, async () => {
                    await db.menus.clear();
                    await db.recipes.clear();
                });
            }
            currentUserIdRef.current = nextUserId;
            setAuthError(null);
            setSession(nextSession);
            setView(nextSession ? resolvePostAuthView(consumePostAuthView()) : 'menus');
            setAuthLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const renderContent = () => {
        switch (view) {
            case 'menus':
                return <MenuPage />;
            case 'materials':
                return (
                    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-x-hidden">
                        <h2 className="text-lg md:text-2xl font-semibold text-foreground">材料管理</h2>
                        <div className="grid grid-cols-1 xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)] gap-6 items-start">
                            <div className="xl:sticky xl:top-6">
                                <MaterialForm
                                    editingMaterial={editingMaterial}
                                    onFinishEdit={() => setEditingMaterial(null)}
                                />
                            </div>
                            <MaterialList onEdit={setEditingMaterial} />
                        </div>
                    </div>
                );
            case 'settings':
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <SettingsPage />
                    </div>
                );
            default:
                return <MenuPage />;
        }
    };

    if (authLoading) {
        return <div className="min-h-dvh w-full flex items-center justify-center text-muted-foreground">認証状態を確認中...</div>;
    }

    if (!session) {
        return <AuthPage initialMessage={authError ?? undefined} />;
    }

    const handleChangeView = (nextView: AppView) => {
        setView(nextView);
        if (nextView === 'menus' || nextView === 'materials') {
            window.localStorage.setItem(LAST_VIEW_KEY, nextView);
        }
    };

    return (
        <Layout currentView={view} onChangeView={handleChangeView}>
            {renderContent()}
        </Layout>
    );
}

export default App;
