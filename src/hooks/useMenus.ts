import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Menu } from '../types';

export const useMenus = (userId?: string | null) => {
    const [menus, setMenus] = useState<Menu[]>([]);
    const refetchTimerRef = useRef<number | null>(null);

    const fetchMenus = useCallback(async () => {
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
    }, [userId]);

    const scheduleRefetch = useCallback(() => {
        if (refetchTimerRef.current) {
            window.clearTimeout(refetchTimerRef.current);
        }
        refetchTimerRef.current = window.setTimeout(() => {
            refetchTimerRef.current = null;
            void fetchMenus();
        }, 120);
    }, [fetchMenus]);

    useEffect(() => {
        void fetchMenus();
    }, [fetchMenus]);

    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`menus-sync-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'menus',
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

    const addMenu = useCallback(async (menu: Omit<Menu, 'id' | 'user_id'>) => {
        if (!userId) {
            throw new Error('ログイン状態を確認できません。');
        }

        const id = crypto.randomUUID();
        const { error } = await supabase.from('menus').insert({
            ...menu,
            user_id: userId,
            id,
        });
        if (error) {
            throw new Error(error.message);
        }
        await fetchMenus();
    }, [fetchMenus, userId]);

    const updateMenu = useCallback(async (id: string, changes: Partial<Menu>) => {
        if (!userId) {
            throw new Error('ログイン状態を確認できません。');
        }

        const { error } = await supabase
            .from('menus')
            .update(changes)
            .eq('id', id)
            .eq('user_id', userId);
        if (error) {
            throw new Error(error.message);
        }
        await fetchMenus();
    }, [fetchMenus, userId]);

    const deleteMenu = useCallback(async (id: string) => {
        if (!userId) {
            throw new Error('ログイン状態を確認できません。');
        }

        const { error } = await supabase
            .from('menus')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error) {
            throw new Error(error.message);
        }
        await fetchMenus();
    }, [fetchMenus, userId]);

    return {
        menus,
        addMenu,
        updateMenu,
        deleteMenu,
    };
};
