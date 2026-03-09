import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type UnsavedChangesContextValue = {
    hasUnsavedMenuChanges: boolean;
    setHasUnsavedMenuChanges: (value: boolean) => void;
};

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null);

export const UnsavedChangesProvider = ({ children }: { children: ReactNode }) => {
    const [hasUnsavedMenuChanges, setHasUnsavedMenuChanges] = useState(false);
    const value = useMemo(
        () => ({ hasUnsavedMenuChanges, setHasUnsavedMenuChanges }),
        [hasUnsavedMenuChanges],
    );

    return (
        <UnsavedChangesContext.Provider value={value}>
            {children}
        </UnsavedChangesContext.Provider>
    );
};

export const useUnsavedChanges = () => {
    const context = useContext(UnsavedChangesContext);
    if (!context) {
        throw new Error('useUnsavedChanges must be used within UnsavedChangesProvider');
    }
    return context;
};
