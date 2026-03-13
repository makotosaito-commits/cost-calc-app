import { describe, expect, it } from 'vitest';
import {
    getSafePurchaseQuantityForCalc,
    normalizeInternalUnit,
    normalizePurchaseQuantity,
    resolveDisplayValues,
    sanitizeBaseUnit,
    sanitizeDisplayUnit
} from './materialUnits';

describe('materialUnits', () => {
    describe('sanitizeDisplayUnit', () => {
        it('accepts only allowed display units', () => {
            expect(sanitizeDisplayUnit('g')).toBe('g');
            expect(sanitizeDisplayUnit('kg')).toBe('kg');
            expect(sanitizeDisplayUnit('ml')).toBe('ml');
            expect(sanitizeDisplayUnit('個')).toBe('個');
            expect(sanitizeDisplayUnit('枚')).toBe('枚');
            expect(sanitizeDisplayUnit('L')).toBeNull();
            expect(sanitizeDisplayUnit('')).toBeNull();
        });
    });

    describe('sanitizeBaseUnit', () => {
        it('normalizes base units to internal units', () => {
            expect(sanitizeBaseUnit('g')).toBe('g');
            expect(sanitizeBaseUnit('ml')).toBe('ml');
            expect(sanitizeBaseUnit('個')).toBe('個');
            expect(sanitizeBaseUnit('枚')).toBe('枚');
            expect(sanitizeBaseUnit('kg')).toBe('g');
            expect(sanitizeBaseUnit('unknown')).toBe('g');
            expect(sanitizeBaseUnit(null, 'ml')).toBe('ml');
        });
    });

    describe('normalizeInternalUnit / normalizePurchaseQuantity', () => {
        it('converts kg input to g internal unit and quantity', () => {
            expect(normalizeInternalUnit('kg')).toBe('g');
            expect(normalizePurchaseQuantity(2, 'kg')).toBe(2000);
            expect(normalizePurchaseQuantity(1.5, 'kg')).toBe(1500);
        });

        it('keeps ml and 個 as-is internally', () => {
            expect(normalizeInternalUnit('ml')).toBe('ml');
            expect(normalizePurchaseQuantity(250, 'ml')).toBe(250);
            expect(normalizeInternalUnit('個')).toBe('個');
            expect(normalizePurchaseQuantity(3, '個')).toBe(3);
            expect(normalizeInternalUnit('枚')).toBe('枚');
            expect(normalizePurchaseQuantity(2, '枚')).toBe(2);
        });
    });

    describe('resolveDisplayValues', () => {
        it('prefers stored display values', () => {
            const resolved = resolveDisplayValues({
                purchase_quantity: 2000,
                base_unit: 'g',
                purchase_display_quantity: 2,
                purchase_display_unit: 'kg',
            });
            expect(resolved.displayQuantity).toBe(2);
            expect(resolved.displayUnit).toBe('kg');
        });

        it('falls back to internal values for legacy records', () => {
            const resolved = resolveDisplayValues({
                purchase_quantity: 400,
                base_unit: 'g',
                purchase_display_quantity: null,
                purchase_display_unit: null,
            });
            expect(resolved.displayQuantity).toBe(400);
            expect(resolved.displayUnit).toBe('g');
        });

        it('falls back to legacy unit and safe quantity when values are invalid', () => {
            const resolved = resolveDisplayValues({
                purchase_quantity: 0,
                base_unit: null as unknown as 'g',
                purchase_display_quantity: null,
                purchase_display_unit: null,
                unit: 'kg',
            });
            expect(resolved.displayQuantity).toBe(1);
            expect(resolved.displayUnit).toBe('kg');
        });
    });

    describe('getSafePurchaseQuantityForCalc', () => {
        it('uses 1 for invalid quantity', () => {
            expect(getSafePurchaseQuantityForCalc(0)).toBe(1);
            expect(getSafePurchaseQuantityForCalc(undefined)).toBe(1);
            expect(getSafePurchaseQuantityForCalc('abc')).toBe(1);
        });
    });
});
