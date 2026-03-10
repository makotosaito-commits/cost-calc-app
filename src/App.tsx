import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Navigate, Route, Routes } from 'react-router-dom';
import { MenuPage } from './components/MenuPage';
import { AuthPage } from './components/AuthPage';
import { Layout } from './components/Layout';
import { LegalPage } from './components/LegalPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { UnsavedChangesProvider } from './contexts/UnsavedChangesContext';
import { db } from './lib/db';
import { supabase } from './lib/supabase';
import { useMaterials } from './hooks/useMaterials';
import { useMenus } from './hooks/useMenus';
import { Material } from './types';

const MaterialsPage = lazy(async () => {
    const module = await import('./components/MaterialsPage');
    return { default: module.MaterialsPage };
});

const SettingsPage = lazy(async () => {
    const module = await import('./components/SettingsPage');
    return { default: module.SettingsPage };
});

type WindowWithIdleCallback = Window & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback?: (handle: number) => void;
};

type MaterialsPageProps = {
    editingMaterial: Material | null;
    setEditingMaterial: (material: Material | null) => void;
    materials: Material[];
    addMaterial: (material: Omit<Material, 'id'>) => Promise<void>;
    updateMaterial: (id: string, changes: Partial<Material>) => Promise<void>;
    deleteMaterial: (id: string) => Promise<void>;
};

const RouteLoadingFallback = () => (
    <div className="min-h-[240px] w-full flex items-center justify-center text-sm text-muted-foreground">
        画面を読み込み中...
    </div>
);

const MaterialsRoute = ({
    editingMaterial,
    setEditingMaterial,
    materials,
    addMaterial,
    updateMaterial,
    deleteMaterial,
}: MaterialsPageProps) => (
    <Suspense fallback={<RouteLoadingFallback />}>
        <MaterialsPage
            editingMaterial={editingMaterial}
            setEditingMaterial={setEditingMaterial}
            materials={materials}
            addMaterial={addMaterial}
            updateMaterial={updateMaterial}
            deleteMaterial={deleteMaterial}
        />
    </Suspense>
);

const SettingsRoute = () => (
    <Suspense fallback={<RouteLoadingFallback />}>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <SettingsPage />
        </div>
    </Suspense>
);

function App() {
    const [session, setSession] = useState<Session | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const currentUserIdRef = useRef<string | null>(null);
    const { materials, addMaterial, updateMaterial, deleteMaterial } = useMaterials();
    const { menus, addMenu, updateMenu, deleteMenu } = useMenus();

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
            setAuthLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!session) return;

        const idleWindow = window as WindowWithIdleCallback;
        const prefetchRoutes = () => {
            void import('./components/MaterialsPage');
            void import('./components/SettingsPage');
        };

        if (idleWindow.requestIdleCallback) {
            const handle = idleWindow.requestIdleCallback(prefetchRoutes, { timeout: 1500 });
            return () => {
                if (idleWindow.cancelIdleCallback) {
                    idleWindow.cancelIdleCallback(handle);
                }
            };
        }

        const timeoutId = window.setTimeout(prefetchRoutes, 300);
        return () => window.clearTimeout(timeoutId);
    }, [session]);

    if (authLoading) {
        return <div className="min-h-dvh w-full flex items-center justify-center text-muted-foreground">認証状態を確認中...</div>;
    }

    return (
        <Routes>
            <Route path="/terms" element={<LegalPage type="terms" />} />
            <Route path="/privacy" element={<LegalPage type="privacy" />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {!session ? (
                <Route path="*" element={<AuthPage initialMessage={authError ?? undefined} />} />
            ) : (
                <Route
                    element={(
                        <UnsavedChangesProvider>
                            <Layout />
                        </UnsavedChangesProvider>
                    )}
                >
                    <Route path="/" element={<Navigate to="/menu" replace />} />
                    <Route
                        path="/menu"
                        element={(
                            <MenuPage
                                menus={menus}
                                addMenu={addMenu}
                                updateMenu={updateMenu}
                                deleteMenu={deleteMenu}
                                materials={materials}
                            />
                        )}
                    />
                    <Route
                        path="/materials"
                        element={(
                            <MaterialsRoute
                                editingMaterial={editingMaterial}
                                setEditingMaterial={setEditingMaterial}
                                materials={materials}
                                addMaterial={addMaterial}
                                updateMaterial={updateMaterial}
                                deleteMaterial={deleteMaterial}
                            />
                        )}
                    />
                    <Route
                        path="/settings"
                        element={<SettingsRoute />}
                    />
                    <Route path="*" element={<Navigate to="/menu" replace />} />
                </Route>
            )}
        </Routes>
    );
}

export default App;
