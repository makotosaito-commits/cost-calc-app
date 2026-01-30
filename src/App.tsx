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
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <h2 className="text-2xl font-bold text-gray-900">材料管理</h2>
                        <MaterialForm />
                        <MaterialList />
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
