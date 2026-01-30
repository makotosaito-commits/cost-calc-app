import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Material } from '../types';

export const useMaterials = () => {
    const materials = useLiveQuery(() => db.materials.toArray());

    const addMaterial = async (material: Omit<Material, 'id'>) => {
        const id = crypto.randomUUID();
        await db.materials.add({
            ...material,
            id,
        } as Material);
    };

    const updateMaterial = async (id: string, changes: Partial<Material>) => {
        await db.materials.update(id, changes);
    };

    const deleteMaterial = async (id: string) => {
        await db.materials.delete(id);
    };

    return {
        materials: materials ?? [],
        addMaterial,
        updateMaterial,
        deleteMaterial,
    };
};
