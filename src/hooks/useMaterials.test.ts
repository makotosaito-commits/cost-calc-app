import { describe, expect, it, vi } from 'vitest';
import { deleteMaterialWithRecipes } from './useMaterials';

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
