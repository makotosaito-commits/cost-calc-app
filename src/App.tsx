import { useState } from 'react';
import { MaterialForm } from './components/MaterialForm';
import { MaterialList } from './components/MaterialList';
import { MenuPage } from './components/MenuPage';
import { SettingsPage } from './components/SettingsPage';
import { Layout } from './components/Layout';

function App() {
    const [view, setView] = useState<'menus' | 'materials' | 'settings'>('menus');

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
                                <MaterialForm />
                            </div>
                            <MaterialList />
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

    return (
        <Layout currentView={view} onChangeView={setView}>
            {renderContent()}
        </Layout>
    );
}

export default App;
