import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Menu } from '../types';

export const useMenus = () => {
    const [menus, setMenus] = useState<Menu[]>([]);

    const fetchMenus = useCallback(async () => {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) {
            setMenus([]);
            return;
        }

        const { data, error } = await supabase
            .from('menus')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch menus from Supabase:', error.message);
            setMenus([]);
            return;
        }

        const normalized: Menu[] = (data ?? []).map((row) => ({
            id: String(row.id),
            user_id: String(row.user_id ?? ''),
            name: String(row.name ?? ''),
            sales_price: Number(row.sales_price ?? 0),
            total_cost: Number(row.total_cost ?? 0),
            gross_profit: Number(row.gross_profit ?? 0),
            cost_rate: Number(row.cost_rate ?? 0),
            image: row.image ? String(row.image) : undefined,
        }));
        setMenus(normalized);
    }, []);

    useEffect(() => {
        void fetchMenus();
    }, [fetchMenus]);

    const addMenu = async (menu: Omit<Menu, 'id' | 'user_id'>) => {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            throw new Error('ログイン状態を確認できません。');
        }

        const id = crypto.randomUUID();
        const { error } = await supabase.from('menus').insert({
            ...menu,
            user_id: userData.user.id,
            id,
        });
        if (error) {
            throw new Error(error.message);
        }
        await fetchMenus();
    };

    const updateMenu = async (id: string, changes: Partial<Menu>) => {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            throw new Error('ログイン状態を確認できません。');
        }

        const { error } = await supabase
            .from('menus')
            .update(changes)
            .eq('id', id)
            .eq('user_id', userData.user.id);
        if (error) {
            throw new Error(error.message);
        }
        await fetchMenus();
    };

    const deleteMenu = async (id: string) => {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            throw new Error('ログイン状態を確認できません。');
        }

        const { error } = await supabase
            .from('menus')
            .delete()
            .eq('id', id)
            .eq('user_id', userData.user.id);
        if (error) {
            throw new Error(error.message);
        }
        await fetchMenus();
    };

    return {
        menus,
        addMenu,
        updateMenu,
        deleteMenu,
    };
};
