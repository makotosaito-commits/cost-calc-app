import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Menu } from '../types';

export const useMenus = () => {
    const menus = useLiveQuery(() => db.menus.toArray());

    const addMenu = async (menu: Omit<Menu, 'id'>) => {
        const id = crypto.randomUUID();
        await db.menus.add({
            ...menu,
            id,
        } as Menu);
    };

    const updateMenu = async (id: string, changes: Partial<Menu>) => {
        await db.menus.update(id, changes);
    };

    const deleteMenu = async (id: string) => {
        await db.transaction('rw', db.menus, db.recipes, async () => {
            await db.menus.delete(id);
            // Delete associated recipes
            await db.recipes.where('menu_id').equals(id).delete();
        });
    };

    return {
        menus: menus ?? [],
        addMenu,
        updateMenu,
        deleteMenu,
    };
};
