import { useCallback, useEffect, useState } from 'react';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';
import { Material } from '../types';
import { sanitizeBaseUnit, sanitizeDisplayUnit } from '../lib/materialUnits';

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

    const hasMissingColumn = (errorMessage: string, columns: string[]) => {
        const message = errorMessage.toLowerCase();
        return columns.some((column) => message.includes(column.toLowerCase()));
    };

    const queryMaterials = async (selectColumns: string, userId: string) => {
        return supabase
            .from('materials')
            .select(selectColumns)
            .eq('user_id', userId)
            .order('name', { ascending: true });
    };

    const fetchMaterials = useCallback(async () => {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) {
            setMaterials([]);
            return;
        }

        const selectWithDisplayAndYield = 'id,name,category,purchase_price,purchase_quantity,base_unit,purchase_display_quantity,purchase_display_unit,yield_rate,calculated_unit_price';
        const selectWithYieldRate = 'id,name,category,purchase_price,purchase_quantity,base_unit,yield_rate,calculated_unit_price';
        const selectLegacy = 'id,name,category,purchase_price,purchase_quantity,base_unit,calculated_unit_price';

        let result = await queryMaterials(selectWithDisplayAndYield, userId);
        if (result.error && hasMissingColumn(result.error.message, ['purchase_display_quantity', 'purchase_display_unit'])) {
            result = await queryMaterials(selectWithYieldRate, userId);
        }
        if (result.error && hasMissingColumn(result.error.message, ['yield_rate'])) {
            result = await queryMaterials(selectLegacy, userId);
        }

        const { data, error } = result;
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
            base_unit: sanitizeBaseUnit(row.base_unit),
            purchase_display_quantity: row.purchase_display_quantity === null || row.purchase_display_quantity === undefined
                ? null
                : Number(row.purchase_display_quantity),
            purchase_display_unit: sanitizeDisplayUnit(row.purchase_display_unit),
            yield_rate: row.yield_rate === null || row.yield_rate === undefined
                ? null
                : Number(row.yield_rate),
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
            purchase_display_quantity: material.purchase_display_quantity ?? null,
            purchase_display_unit: material.purchase_display_unit ?? null,
            yield_rate: material.yield_rate ?? null,
            calculated_unit_price: material.calculated_unit_price ?? 0,
        };
        const { purchase_display_quantity: _omitDisplayQuantity, purchase_display_unit: _omitDisplayUnit, ...payloadWithoutDisplay } = payload;
        const { yield_rate: _omitYieldRate, ...payloadWithoutYield } = payload;
        const { yield_rate: _omitYieldRate2, ...payloadWithoutDisplayAndYield } = payloadWithoutDisplay;

        let { error } = await supabase.from('materials').insert(payload);
        if (error && hasMissingColumn(error.message, ['purchase_display_quantity', 'purchase_display_unit'])) {
            const fallback = await supabase.from('materials').insert(payloadWithoutDisplay);
            error = fallback.error;
            if (error && hasMissingColumn(error.message, ['yield_rate'])) {
                const secondFallback = await supabase.from('materials').insert(payloadWithoutDisplayAndYield);
                error = secondFallback.error;
            }
        } else if (error && hasMissingColumn(error.message, ['yield_rate'])) {
            const fallback = await supabase.from('materials').insert(payloadWithoutYield);
            error = fallback.error;
            if (error && hasMissingColumn(error.message, ['purchase_display_quantity', 'purchase_display_unit'])) {
                const secondFallback = await supabase.from('materials').insert(payloadWithoutDisplayAndYield);
                error = secondFallback.error;
            }
        }

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

        const updatePayload: Partial<Material> = { ...changes };
        const { purchase_display_quantity: _omitDisplayQuantity, purchase_display_unit: _omitDisplayUnit, ...changesWithoutDisplay } = updatePayload;
        const { yield_rate: _omitYieldRate, ...changesWithoutYield } = updatePayload;
        const { yield_rate: _omitYieldRate2, ...changesWithoutDisplayAndYield } = changesWithoutDisplay;

        let { error } = await supabase
            .from('materials')
            .update(updatePayload)
            .eq('id', id)
            .eq('user_id', userData.user.id);

        if (error && hasMissingColumn(error.message, ['purchase_display_quantity', 'purchase_display_unit'])) {
            const fallback = await supabase
                .from('materials')
                .update(changesWithoutDisplay)
                .eq('id', id)
                .eq('user_id', userData.user.id);
            error = fallback.error;
            if (error && hasMissingColumn(error.message, ['yield_rate'])) {
                const secondFallback = await supabase
                    .from('materials')
                    .update(changesWithoutDisplayAndYield)
                    .eq('id', id)
                    .eq('user_id', userData.user.id);
                error = secondFallback.error;
            }
        } else if (error && hasMissingColumn(error.message, ['yield_rate'])) {
            const fallback = await supabase
                .from('materials')
                .update(changesWithoutYield)
                .eq('id', id)
                .eq('user_id', userData.user.id);
            error = fallback.error;
            if (error && hasMissingColumn(error.message, ['purchase_display_quantity', 'purchase_display_unit'])) {
                const secondFallback = await supabase
                    .from('materials')
                    .update(changesWithoutDisplayAndYield)
                    .eq('id', id)
                    .eq('user_id', userData.user.id);
                error = secondFallback.error;
            }
        }

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
