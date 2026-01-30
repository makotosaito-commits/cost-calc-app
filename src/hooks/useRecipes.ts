import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Recipe } from '../types';

export const useRecipes = (menuId?: string) => {
    const recipes = useLiveQuery(
        () => (menuId ? db.recipes.where('menu_id').equals(menuId).toArray() : []),
        [menuId]
    );

    const addRecipe = async (recipe: Omit<Recipe, 'id'>) => {
        const id = crypto.randomUUID();
        await db.recipes.add({
            ...recipe,
            id,
        } as Recipe);
    };

    const updateRecipe = async (id: string, changes: Partial<Recipe>) => {
        await db.recipes.update(id, changes);
    };

    const deleteRecipe = async (id: string) => {
        await db.recipes.delete(id);
    };

    return {
        recipes: recipes ?? [],
        addRecipe,
        updateRecipe,
        deleteRecipe,
    };
};
