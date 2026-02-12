import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Recipe } from '../types';

export const useRecipes = (menuId?: string) => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);

    const fetchRecipes = useCallback(async () => {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId || !menuId) {
            setRecipes([]);
            return;
        }

        const { data, error } = await supabase
            .from('recipes')
            .select('*')
            .eq('user_id', userId)
            .eq('menu_id', menuId);

        if (error) {
            console.error('Failed to fetch recipes from Supabase:', error.message);
            setRecipes([]);
            return;
        }

        const normalized: Recipe[] = (data ?? []).map((row) => ({
            id: String(row.id),
            user_id: String(row.user_id ?? ''),
            menu_id: String(row.menu_id ?? ''),
            material_id: String(row.material_id ?? ''),
            usage_amount: Number(row.usage_amount ?? 0),
            usage_unit: String(row.usage_unit ?? 'g'),
            yield_rate: Number(row.yield_rate ?? 100),
        }));
        setRecipes(normalized);
    }, [menuId]);

    useEffect(() => {
        void fetchRecipes();
    }, [fetchRecipes]);

    const addRecipe = async (recipe: Omit<Recipe, 'id' | 'user_id'>) => {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            throw new Error('ログイン状態を確認できません。');
        }

        const id = crypto.randomUUID();
        const { error } = await supabase.from('recipes').insert({
            ...recipe,
            user_id: userData.user.id,
            id,
        });
        if (error) {
            throw new Error(error.message);
        }
        await fetchRecipes();
    };

    const updateRecipe = async (id: string, changes: Partial<Recipe>) => {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            throw new Error('ログイン状態を確認できません。');
        }

        const { error } = await supabase
            .from('recipes')
            .update(changes)
            .eq('id', id)
            .eq('user_id', userData.user.id);
        if (error) {
            throw new Error(error.message);
        }
        await fetchRecipes();
    };

    const deleteRecipe = async (id: string) => {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            throw new Error('ログイン状態を確認できません。');
        }

        const { error } = await supabase
            .from('recipes')
            .delete()
            .eq('id', id)
            .eq('user_id', userData.user.id);
        if (error) {
            throw new Error(error.message);
        }
        await fetchRecipes();
    };

    return {
        recipes,
        addRecipe,
        updateRecipe,
        deleteRecipe,
    };
};
