import { Material } from '../types';
import { MaterialForm } from './MaterialForm';
import { MaterialList } from './MaterialList';

type MaterialsPageProps = {
    editingMaterial: Material | null;
    setEditingMaterial: (material: Material | null) => void;
    materials: Material[];
    addMaterial: (material: Omit<Material, 'id'>) => Promise<void>;
    updateMaterial: (id: string, changes: Partial<Material>) => Promise<void>;
    deleteMaterial: (id: string) => Promise<void>;
};

export const MaterialsPage = ({
    editingMaterial,
    setEditingMaterial,
    materials,
    addMaterial,
    updateMaterial,
    deleteMaterial,
}: MaterialsPageProps) => (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-x-hidden xl:flex xl:h-[calc(100dvh-9.5rem)] xl:flex-col xl:space-y-0 xl:overflow-hidden">
        <div className="xl:mb-4 xl:shrink-0">
            <h2 className="text-lg md:text-2xl font-semibold text-foreground">材料管理</h2>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)] gap-6 items-start xl:flex-1 xl:min-h-0 xl:overflow-hidden">
            <div className="xl:sticky xl:top-0 xl:h-full xl:max-h-full xl:overflow-hidden">
                <MaterialForm
                    editingMaterial={editingMaterial}
                    onFinishEdit={() => setEditingMaterial(null)}
                    addMaterial={addMaterial}
                    updateMaterial={updateMaterial}
                />
            </div>
            <div className="xl:h-full xl:min-h-0 xl:overflow-y-auto xl:pr-1">
                <MaterialList
                    onEdit={setEditingMaterial}
                    materials={materials}
                    deleteMaterial={deleteMaterial}
                />
            </div>
        </div>
    </div>
);
