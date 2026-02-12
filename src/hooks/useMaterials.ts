import { useCallback, useEffect, useState } from 'react';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';
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
    const [materials, setMaterials] = useState<Material[]>([]);

    const fetchMaterials = useCallback(async () => {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) {
            setMaterials([]);
            return;
        }

        const { data, error } = await supabase
            .from('materials')
            .select('id,name,category,purchase_price,purchase_quantity,base_unit,calculated_unit_price')
            .eq('user_id', userId)
            .order('name', { ascending: true });

        if (error) {
            console.error('Failed to fetch materials from Supabase:', error.message);
            setMaterials([]);
            return;
        }

        const normalized: Material[] = (data ?? []).map((row) => ({
            id: String(row.id),
            name: String(row.name ?? ''),
            category: String(row.category ?? ''),
            purchase_price: Number(row.purchase_price ?? 0),
            purchase_quantity: Number(row.purchase_quantity ?? 0),
            base_unit: (row.base_unit ?? 'g') as Material['base_unit'],
            calculated_unit_price: Number(row.calculated_unit_price ?? 0),
        }));

        setMaterials(normalized);
    }, []);

    useEffect(() => {
        void fetchMaterials();
    }, [fetchMaterials]);

    const addMaterial = async (material: Omit<Material, 'id'>) => {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            throw new Error('ログイン状態を確認できません。');
        }
        const id = crypto.randomUUID();
        const payload = {
            id,
            user_id: userData.user.id,
            name: material.name,
            category: material.category,
            purchase_price: material.purchase_price,
            purchase_quantity: material.purchase_quantity,
            base_unit: material.base_unit,
            calculated_unit_price: material.calculated_unit_price ?? 0,
        };
        const { error } = await supabase.from('materials').insert(payload);
        if (error) {
            throw new Error(error.message);
        }
        await fetchMaterials();
    };

    const updateMaterial = async (id: string, changes: Partial<Material>) => {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            throw new Error('ログイン状態を確認できません。');
        }

        const { error } = await supabase
            .from('materials')
            .update(changes)
            .eq('id', id)
            .eq('user_id', userData.user.id);

        if (error) {
            throw new Error(error.message);
        }
        await fetchMaterials();
    };

    const deleteMaterial = async (id: string) => {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            throw new Error('ログイン状態を確認できません。');
        }

        const { error } = await supabase
            .from('materials')
            .delete()
            .eq('id', id)
            .eq('user_id', userData.user.id);

        if (error) {
            throw new Error(error.message);
        }

        // menus/recipes は現段階で Dexie なので、ローカル整合性は維持する
        await db.recipes.where('material_id').equals(id).delete();
        await fetchMaterials();
    };

    return {
        materials,
        addMaterial,
        updateMaterial,
        deleteMaterial,
    };
};
