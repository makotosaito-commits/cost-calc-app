import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Recipe } from '../types';

export const useRecipes = (menuId?: string, userId?: string | null) => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const refetchTimerRef = useRef<number | null>(null);

    const fetchRecipes = useCallback(async () => {
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
    }, [menuId, userId]);

    const scheduleRefetch = useCallback(() => {
        if (refetchTimerRef.current) {
            window.clearTimeout(refetchTimerRef.current);
        }
        refetchTimerRef.current = window.setTimeout(() => {
            refetchTimerRef.current = null;
            void fetchRecipes();
        }, 120);
    }, [fetchRecipes]);

    useEffect(() => {
        void fetchRecipes();
    }, [fetchRecipes]);

    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`recipes-sync-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'recipes',
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    scheduleRefetch();
                }
            )
            .subscribe();

        return () => {
            if (refetchTimerRef.current) {
                window.clearTimeout(refetchTimerRef.current);
                refetchTimerRef.current = null;
            }
            void supabase.removeChannel(channel);
        };
    }, [scheduleRefetch, userId]);

    const addRecipe = useCallback(async (recipe: Omit<Recipe, 'id' | 'user_id'>) => {
        if (!userId) {
            throw new Error('ログイン状態を確認できません。');
        }

        const id = crypto.randomUUID();
        const optimisticRecipe: Recipe = {
            id,
            user_id: userId,
            menu_id: String(recipe.menu_id ?? ''),
            material_id: String(recipe.material_id ?? ''),
            usage_amount: Number(recipe.usage_amount ?? 0),
            usage_unit: String(recipe.usage_unit ?? 'g'),
            yield_rate: Number(recipe.yield_rate ?? 100),
        };
        setRecipes((prev) => [...prev, optimisticRecipe]);

        const { error } = await supabase.from('recipes').insert({
            ...recipe,
            user_id: userId,
            id,
        });
        if (error) {
            setRecipes((prev) => prev.filter((item) => item.id !== id));
            throw new Error(error.message);
        }
    }, [userId]);

    const updateRecipe = useCallback(async (id: string, changes: Partial<Recipe>) => {
        if (!userId) {
            throw new Error('ログイン状態を確認できません。');
        }

        const previousRecipe = recipes.find((recipe) => recipe.id === id);
        setRecipes((prev) => prev.map((recipe) => {
            if (recipe.id !== id) return recipe;
            return { ...recipe, ...changes };
        }));

        const { error } = await supabase
            .from('recipes')
            .update(changes)
            .eq('id', id)
            .eq('user_id', userId);
        if (error) {
            if (previousRecipe) {
                setRecipes((prev) => prev.map((recipe) => recipe.id === id ? previousRecipe as Recipe : recipe));
            } else {
                await fetchRecipes();
            }
            throw new Error(error.message);
        }
    }, [fetchRecipes, recipes, userId]);

    const deleteRecipe = useCallback(async (id: string) => {
        if (!userId) {
            throw new Error('ログイン状態を確認できません。');
        }

        const removedIndex = recipes.findIndex((recipe) => recipe.id === id);
        const removedRecipe = removedIndex >= 0 ? recipes[removedIndex] : undefined;
        setRecipes((prev) => prev.filter((recipe) => recipe.id !== id));

        const { error } = await supabase
            .from('recipes')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error) {
            if (removedRecipe && removedIndex >= 0) {
                setRecipes((prev) => {
                    const next = [...prev];
                    next.splice(Math.min(removedIndex, next.length), 0, removedRecipe as Recipe);
                    return next;
                });
            } else {
                await fetchRecipes();
            }
            throw new Error(error.message);
        }
    }, [fetchRecipes, recipes, userId]);

    return {
        recipes,
        addRecipe,
        updateRecipe,
        deleteRecipe,
    };
};
