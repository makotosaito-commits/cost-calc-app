import { useEffect, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Navigate, Route, Routes } from 'react-router-dom';
import { MaterialForm } from './components/MaterialForm';
import { MaterialList } from './components/MaterialList';
import { MenuPage } from './components/MenuPage';
import { SettingsPage } from './components/SettingsPage';
import { AuthPage } from './components/AuthPage';
import { Layout } from './components/Layout';
import { LegalPage } from './components/LegalPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { UnsavedChangesProvider } from './contexts/UnsavedChangesContext';
import { db } from './lib/db';
import { supabase } from './lib/supabase';
import { useMaterials } from './hooks/useMaterials';
import { Material } from './types';

type MaterialsPageProps = {
    editingMaterial: Material | null;
    setEditingMaterial: (material: Material | null) => void;
    materials: Material[];
    addMaterial: (material: Omit<Material, 'id'>) => Promise<void>;
    updateMaterial: (id: string, changes: Partial<Material>) => Promise<void>;
    deleteMaterial: (id: string) => Promise<void>;
};

const MaterialsPage = ({
    editingMaterial,
    setEditingMaterial,
    materials,
    addMaterial,
    updateMaterial,
    deleteMaterial,
}: MaterialsPageProps) => (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-x-hidden">
        <h2 className="text-lg md:text-2xl font-semibold text-foreground">材料管理</h2>
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)] gap-6 items-start">
            <div className="xl:sticky xl:top-6">
                <MaterialForm
                    editingMaterial={editingMaterial}
                    onFinishEdit={() => setEditingMaterial(null)}
                    addMaterial={addMaterial}
                    updateMaterial={updateMaterial}
                />
            </div>
            <MaterialList
                onEdit={setEditingMaterial}
                materials={materials}
                deleteMaterial={deleteMaterial}
            />
        </div>
    </div>
);

function App() {
    const [session, setSession] = useState<Session | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const currentUserIdRef = useRef<string | null>(null);
    const { materials, addMaterial, updateMaterial, deleteMaterial } = useMaterials();

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
                    <Route path="/menu" element={<MenuPage />} />
                    <Route
                        path="/materials"
                        element={(
                            <MaterialsPage
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
                        element={(
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <SettingsPage />
                            </div>
                        )}
                    />
                    <Route path="*" element={<Navigate to="/menu" replace />} />
                </Route>
            )}
        </Routes>
    );
}

export default App;
