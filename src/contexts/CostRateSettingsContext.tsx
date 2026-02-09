import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
    CostRateSettings,
    DEFAULT_COST_RATE_SETTINGS,
    loadCostRateSettings,
    sanitizeCostRateSettings,
    saveCostRateSettings,
} from '../lib/costRateSettings';

interface CostRateSettingsContextValue {
    settings: CostRateSettings;
    updateSettings: (changes: Partial<CostRateSettings>) => void;
    resetSettings: () => void;
}

const CostRateSettingsContext = createContext<CostRateSettingsContextValue | null>(null);

export const CostRateSettingsProvider = ({ children }: { children: ReactNode }) => {
    const [settings, setSettings] = useState<CostRateSettings>(() => loadCostRateSettings());

    const updateSettings = (changes: Partial<CostRateSettings>) => {
        setSettings((prev) => {
            const next = sanitizeCostRateSettings({ ...prev, ...changes });
            saveCostRateSettings(next);
            return next;
        });
    };

    const resetSettings = () => {
        setSettings(DEFAULT_COST_RATE_SETTINGS);
        saveCostRateSettings(DEFAULT_COST_RATE_SETTINGS);
    };

    const value = useMemo(() => ({ settings, updateSettings, resetSettings }), [settings]);

    return <CostRateSettingsContext.Provider value={value}>{children}</CostRateSettingsContext.Provider>;
};

export const useCostRateSettings = () => {
    const ctx = useContext(CostRateSettingsContext);
    if (!ctx) {
        throw new Error('useCostRateSettings must be used within CostRateSettingsProvider');
    }
    return ctx;
};
