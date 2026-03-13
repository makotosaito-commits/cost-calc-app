import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Material } from '../types';
import { inferYieldRateFromUnitPrice, normalizeYieldRate, toSafeNumber } from '../lib/calculator';
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

type YieldRateMergeRow = {
    id?: unknown;
    yield_rate?: unknown;
};

type ResolveMaterialYieldRateParams = {
    rawYieldRate: unknown;
    mergedYieldRate?: number | null;
    purchasePrice: number;
    purchaseQuantity: number;
    calculatedUnitPrice: number;
};

export const buildYieldRateMap = (rows: YieldRateMergeRow[]) => {
    const map = new Map<string, number | null>();
    for (const row of rows) {
        if (row.id === undefined || row.id === null) continue;
        const materialId = String(row.id);
        const normalizedYieldRate = row.yield_rate === null || row.yield_rate === undefined
            ? null
            : normalizeYieldRate(row.yield_rate);
        map.set(materialId, normalizedYieldRate);
    }
    return map;
};

export const resolveMaterialYieldRate = ({
    rawYieldRate,
    mergedYieldRate,
    purchasePrice,
    purchaseQuantity,
    calculatedUnitPrice,
}: ResolveMaterialYieldRateParams) => {
    const dbYieldRate = mergedYieldRate !== undefined
        ? mergedYieldRate
        : rawYieldRate === undefined
            ? undefined
            : (rawYieldRate === null ? null : normalizeYieldRate(rawYieldRate));

    const inferredYieldRate = inferYieldRateFromUnitPrice(
        purchasePrice,
        purchaseQuantity,
        calculatedUnitPrice
    );

    return {
        yieldRate: dbYieldRate === undefined ? inferredYieldRate : dbYieldRate,
        usedFallback: dbYieldRate === undefined,
    };
};

export const useMaterials = (userId?: string | null) => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const refetchTimerRef = useRef<number | null>(null);

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

    const sanitizePurchaseQuantity = (value: unknown) => {
        const numeric = toSafeNumber(value);
        return numeric > 0 ? numeric : 1;
    };

    const normalizeYieldRateForSave = (value: unknown): number | null => {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        return normalizeYieldRate(value);
    };

    const fetchMaterials = useCallback(async () => {
        if (!userId) {
            setMaterials([]);
            return;
        }

        const selectAttempts: Array<{ columns: string; includesYieldRate: boolean }> = [
            {
                columns: 'id,name,category,purchase_price,purchase_quantity,base_unit,unit,purchase_display_quantity,purchase_display_unit,yield_rate,calculated_unit_price',
                includesYieldRate: true,
            },
            {
                columns: 'id,name,category,purchase_price,purchase_quantity,base_unit,purchase_display_quantity,purchase_display_unit,yield_rate,calculated_unit_price',
                includesYieldRate: true,
            },
            {
                columns: 'id,name,category,purchase_price,purchase_quantity,base_unit,unit,yield_rate,calculated_unit_price',
                includesYieldRate: true,
            },
            {
                columns: 'id,name,category,purchase_price,purchase_quantity,base_unit,yield_rate,calculated_unit_price',
                includesYieldRate: true,
            },
            {
                columns: 'id,name,category,purchase_price,purchase_quantity,base_unit,unit,calculated_unit_price',
                includesYieldRate: false,
            },
            {
                columns: 'id,name,category,purchase_price,purchase_quantity,base_unit,calculated_unit_price',
                includesYieldRate: false,
            },
        ];

        let selectedAttempt = selectAttempts[0];
        let result = await queryMaterials(selectedAttempt.columns, userId);
        for (let i = 1; i < selectAttempts.length; i += 1) {
            if (!result.error) break;
            if (!hasMissingColumn(result.error.message, ['purchase_display_quantity', 'purchase_display_unit', 'yield_rate', 'unit'])) {
                break;
            }
            selectedAttempt = selectAttempts[i];
            result = await queryMaterials(selectedAttempt.columns, userId);
        }

        const { data, error } = result;
        if (error) {
            console.error('Failed to fetch materials from Supabase:', error.message);
            setMaterials([]);
            return;
        }

        const rows = data ?? [];
        const yieldRateById = new Map<string, number | null>();
        const shouldMergeYieldRates = !selectedAttempt.includesYieldRate
            || rows.some((row) => !Object.prototype.hasOwnProperty.call(row, 'yield_rate'));

        if (shouldMergeYieldRates) {
            const yieldRateResult = await supabase
                .from('materials')
                .select('id,name,yield_rate')
                .eq('user_id', userId);

            if (yieldRateResult.error) {
                console.warn('[useMaterials] Failed to load yield_rate via fallback merge:', yieldRateResult.error.message);
            } else {
                const mergedMap = buildYieldRateMap(yieldRateResult.data ?? []);
                for (const [materialId, normalizedYieldRate] of mergedMap.entries()) {
                    yieldRateById.set(materialId, normalizedYieldRate);
                }
            }
        }

        let unresolvedYieldRateCount = 0;

        const normalized: Material[] = rows.map((row) => {
            const materialId = String(row.id);
            const hasYieldRateColumn = Object.prototype.hasOwnProperty.call(row, 'yield_rate');
            const rawYieldRate = hasYieldRateColumn ? row.yield_rate : undefined;
            const purchasePrice = Number(row.purchase_price ?? 0);
            const purchaseQuantity = sanitizePurchaseQuantity(row.purchase_quantity);
            const calculatedUnitPrice = Number(row.calculated_unit_price ?? 0);
            const mergedYieldRate = yieldRateById.has(materialId)
                ? yieldRateById.get(materialId)
                : undefined;
            const yieldResolution = resolveMaterialYieldRate({
                rawYieldRate,
                mergedYieldRate,
                purchasePrice,
                purchaseQuantity,
                calculatedUnitPrice,
            });

            if (yieldResolution.usedFallback) {
                unresolvedYieldRateCount += 1;
            }

            return {
                id: materialId,
                name: String(row.name ?? ''),
                category: String(row.category ?? ''),
                purchase_price: purchasePrice,
                purchase_quantity: purchaseQuantity,
                base_unit: sanitizeBaseUnit(row.base_unit, row.unit),
                purchase_display_quantity: row.purchase_display_quantity === null || row.purchase_display_quantity === undefined
                    ? null
                    : (() => {
                        const numeric = toSafeNumber(row.purchase_display_quantity);
                        return numeric > 0 ? numeric : null;
                    })(),
                purchase_display_unit: sanitizeDisplayUnit(row.purchase_display_unit),
                yield_rate: yieldResolution.yieldRate,
                calculated_unit_price: calculatedUnitPrice,
            };
        });

        if (unresolvedYieldRateCount > 0) {
            console.warn(`[useMaterials] ${unresolvedYieldRateCount} materials resolved without DB yield_rate; fallback value applied.`);
        }

        setMaterials(normalized);
    }, [userId]);

    const scheduleRefetch = useCallback(() => {
        if (refetchTimerRef.current) {
            window.clearTimeout(refetchTimerRef.current);
        }
        refetchTimerRef.current = window.setTimeout(() => {
            refetchTimerRef.current = null;
            void fetchMaterials();
        }, 120);
    }, [fetchMaterials]);

    useEffect(() => {
        void fetchMaterials();
    }, [fetchMaterials]);

    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`materials-sync-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'materials',
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

    const addMaterial = useCallback(async (material: Omit<Material, 'id'>) => {
        if (!userId) {
            throw new Error('ログイン状態を確認できません。');
        }
        const id = crypto.randomUUID();
        const payload = {
            id,
            user_id: userId,
            name: material.name,
            category: material.category,
            purchase_price: material.purchase_price,
            purchase_quantity: sanitizePurchaseQuantity(material.purchase_quantity),
            base_unit: sanitizeBaseUnit(material.base_unit),
            purchase_display_quantity: (() => {
                const numeric = toSafeNumber(material.purchase_display_quantity);
                return numeric > 0 ? numeric : null;
            })(),
            purchase_display_unit: sanitizeDisplayUnit(material.purchase_display_unit),
            yield_rate: normalizeYieldRateForSave(material.yield_rate),
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
    }, [fetchMaterials, userId]);

    const updateMaterial = useCallback(async (id: string, changes: Partial<Material>) => {
        if (!userId) {
            throw new Error('ログイン状態を確認できません。');
        }

        const updatePayload: Partial<Material> = { ...changes };
        if (Object.prototype.hasOwnProperty.call(updatePayload, 'purchase_quantity')) {
            updatePayload.purchase_quantity = sanitizePurchaseQuantity(updatePayload.purchase_quantity);
        }
        if (Object.prototype.hasOwnProperty.call(updatePayload, 'purchase_display_quantity')) {
            const numeric = toSafeNumber(updatePayload.purchase_display_quantity);
            updatePayload.purchase_display_quantity = numeric > 0 ? numeric : null;
        }
        if (Object.prototype.hasOwnProperty.call(updatePayload, 'purchase_display_unit')) {
            updatePayload.purchase_display_unit = sanitizeDisplayUnit(updatePayload.purchase_display_unit);
        }
        if (Object.prototype.hasOwnProperty.call(updatePayload, 'base_unit')) {
            updatePayload.base_unit = sanitizeBaseUnit(updatePayload.base_unit);
        }
        if (Object.prototype.hasOwnProperty.call(updatePayload, 'yield_rate')) {
            updatePayload.yield_rate = normalizeYieldRateForSave(updatePayload.yield_rate);
        }

        const { purchase_display_quantity: _omitDisplayQuantity, purchase_display_unit: _omitDisplayUnit, ...changesWithoutDisplay } = updatePayload;
        const { yield_rate: _omitYieldRate, ...changesWithoutYield } = updatePayload;
        const { yield_rate: _omitYieldRate2, ...changesWithoutDisplayAndYield } = changesWithoutDisplay;

        let { error } = await supabase
            .from('materials')
            .update(updatePayload)
            .eq('id', id)
            .eq('user_id', userId);

        if (error && hasMissingColumn(error.message, ['purchase_display_quantity', 'purchase_display_unit'])) {
            const fallback = await supabase
                .from('materials')
                .update(changesWithoutDisplay)
                .eq('id', id)
                .eq('user_id', userId);
            error = fallback.error;
            if (error && hasMissingColumn(error.message, ['yield_rate'])) {
                const secondFallback = await supabase
                    .from('materials')
                    .update(changesWithoutDisplayAndYield)
                    .eq('id', id)
                    .eq('user_id', userId);
                error = secondFallback.error;
            }
        } else if (error && hasMissingColumn(error.message, ['yield_rate'])) {
            const fallback = await supabase
                .from('materials')
                .update(changesWithoutYield)
                .eq('id', id)
                .eq('user_id', userId);
            error = fallback.error;
            if (error && hasMissingColumn(error.message, ['purchase_display_quantity', 'purchase_display_unit'])) {
                const secondFallback = await supabase
                    .from('materials')
                    .update(changesWithoutDisplayAndYield)
                    .eq('id', id)
                    .eq('user_id', userId);
                error = secondFallback.error;
            }
        }

        if (error) {
            throw new Error(error.message);
        }
        await fetchMaterials();
    }, [fetchMaterials, userId]);

    const deleteMaterial = useCallback(async (id: string) => {
        if (!userId) {
            throw new Error('ログイン状態を確認できません。');
        }

        const { error } = await supabase
            .from('materials')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            throw new Error(error.message);
        }
        await fetchMaterials();
    }, [fetchMaterials, userId]);

    return {
        materials,
        addMaterial,
        updateMaterial,
        deleteMaterial,
    };
};
