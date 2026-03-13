import { describe, expect, it, vi } from 'vitest';

vi.mock('../lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        })),
        removeChannel: vi.fn(),
    },
}));

import { buildYieldRateMap, deleteMaterialWithRecipes, resolveMaterialYieldRate } from './useMaterials';

describe('deleteMaterialWithRecipes', () => {
    it('deletes material and dependent recipes in one transaction', async () => {
        const materialDelete = vi.fn().mockResolvedValue(undefined);
        const recipeDelete = vi.fn().mockResolvedValue(undefined);
        const equals = vi.fn().mockReturnValue({ delete: recipeDelete });
        const where = vi.fn().mockReturnValue({ equals });
        const transaction = vi.fn(async (_mode, _materials, _recipes, scope: () => Promise<void>) => {
            await scope();
        });

        const mockDb = {
            transaction,
            materials: { delete: materialDelete },
            recipes: { where },
        };

        await deleteMaterialWithRecipes(mockDb, 'material-1');

        expect(transaction).toHaveBeenCalledTimes(1);
        expect(transaction).toHaveBeenCalledWith(
            'rw',
            mockDb.materials,
            mockDb.recipes,
            expect.any(Function)
        );
        expect(materialDelete).toHaveBeenCalledWith('material-1');
        expect(where).toHaveBeenCalledWith('material_id');
        expect(equals).toHaveBeenCalledWith('material-1');
        expect(recipeDelete).toHaveBeenCalledTimes(1);
    });
});

describe('buildYieldRateMap', () => {
    it('normalizes numeric yield rates and keeps null as null', () => {
        const result = buildYieldRateMap([
            { id: 'a', yield_rate: 90 },
            { id: 'b', yield_rate: null },
            { id: 'c', yield_rate: 120 },
        ]);

        expect(result.get('a')).toBe(90);
        expect(result.get('b')).toBeNull();
        expect(result.get('c')).toBe(100);
    });

    it('skips rows without id', () => {
        const result = buildYieldRateMap([
            { yield_rate: 90 },
            { id: null, yield_rate: 85 },
            { id: 'ok', yield_rate: 50 },
        ]);

        expect(result.size).toBe(1);
        expect(result.get('ok')).toBe(50);
    });
});

describe('resolveMaterialYieldRate', () => {
    it('prioritizes merged DB value over inferred value', () => {
        const result = resolveMaterialYieldRate({
            rawYieldRate: undefined,
            mergedYieldRate: 85,
            purchasePrice: 2000,
            purchaseQuantity: 2000,
            calculatedUnitPrice: 2,
        });

        expect(result.yieldRate).toBe(85);
        expect(result.usedFallback).toBe(false);
    });

    it('uses raw DB value when present', () => {
        const result = resolveMaterialYieldRate({
            rawYieldRate: 50,
            mergedYieldRate: undefined,
            purchasePrice: 2000,
            purchaseQuantity: 2000,
            calculatedUnitPrice: 2,
        });

        expect(result.yieldRate).toBe(50);
        expect(result.usedFallback).toBe(false);
    });

    it('uses inferred yield when DB value is missing', () => {
        const result = resolveMaterialYieldRate({
            rawYieldRate: undefined,
            mergedYieldRate: undefined,
            purchasePrice: 2000,
            purchaseQuantity: 2000,
            calculatedUnitPrice: 2,
        });

        expect(result.yieldRate).toBe(50);
        expect(result.usedFallback).toBe(true);
    });

    it('keeps null as explicit unset (100% handling in calculator)', () => {
        const result = resolveMaterialYieldRate({
            rawYieldRate: null,
            mergedYieldRate: undefined,
            purchasePrice: 2000,
            purchaseQuantity: 2000,
            calculatedUnitPrice: 1,
        });

        expect(result.yieldRate).toBeNull();
        expect(result.usedFallback).toBe(false);
    });
});
