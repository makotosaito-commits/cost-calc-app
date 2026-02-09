import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Material } from '../types';

type MaterialDeleteDb = {
    transaction: (
        mode: 'rw',
        materials: unknown,
        recipes: unknown,
        scope: () => Promise<void>
    ) => Promise<unknown>;
    materials: {
        delete: (id: string) => Promise<unknown>;
    };
    recipes: {
        where: (index: 'material_id') => {
            equals: (id: string) => {
                delete: () => Promise<unknown>;
            };
        };
    };
};

export const deleteMaterialWithRecipes = async (database: MaterialDeleteDb, id: string) => {
    await database.transaction('rw', database.materials, database.recipes, async () => {
        await database.materials.delete(id);
        await database.recipes.where('material_id').equals(id).delete();
    });
};

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
        await deleteMaterialWithRecipes(db, id);
    };

    return {
        materials: materials ?? [],
        addMaterial,
        updateMaterial,
        deleteMaterial,
    };
};
