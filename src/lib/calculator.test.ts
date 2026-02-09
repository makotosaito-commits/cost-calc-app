import { describe, it, expect } from 'vitest';
import { calculateUnitPrice, normalizeAmount, calculateLineCost, toSafeNumber, calculateMenuMetrics } from './calculator';

describe('Calculator Logic', () => {
    describe('calculateUnitPrice', () => {
        it('calculates correct unit price', () => {
            expect(calculateUnitPrice(1000, 500)).toBe(2); // 1000円 / 500g = 2円/g
        });

        it('returns 0 if quantity is 0', () => {
            expect(calculateUnitPrice(1000, 0)).toBe(0);
        });
    });

    describe('normalizeAmount', () => {
        it('converts kg to g', () => {
            expect(normalizeAmount(1, 'kg')).toBe(1000);
            expect(normalizeAmount(0.5, 'kg')).toBe(500);
        });

        it('converts L to ml', () => {
            expect(normalizeAmount(2, 'L')).toBe(2000);
        });

        it('keeps base units as is', () => {
            expect(normalizeAmount(100, 'g')).toBe(100);
            expect(normalizeAmount(100, 'ml')).toBe(100);
            expect(normalizeAmount(5, '個')).toBe(5);
        });
    });

    describe('calculateLineCost', () => {
        // 例: 豚肉
        // Finish: 100g 使用
        // Unit Price: 2円/g (1000円/500g)
        // Yield: 90%

        // 実質使用量 = 100 / 0.9 = 111.11... g
        // Cost = 111.11... * 2 = 222.22...

        it('calculates cost with yield rate', () => {
            const cost = calculateLineCost(100, 'g', 90, 2);
            expect(cost).toBeCloseTo(222.22, 2);
        });

        // 例: 水
        // Finish: 1 L (= 1000ml)
        // Base Price: 0.1円/ml (100円/1000ml)
        // Yield: 100%

        // 実質 = 1000 / 1.0 = 1000
        // Norm = 1000
        // Cost = 1000 * 0.1 = 100
        it('calculates cost with unit conversion', () => {
            const cost = calculateLineCost(1, 'L', 100, 0.1);
            expect(cost).toBe(100);
        });

        it('handles 0 yield gracefully', () => {
            expect(calculateLineCost(100, 'g', 0, 10)).toBe(0);
        });

        it('handles large usage without string-format contamination', () => {
            // 220200 g * 10 円/g = 2,202,000 円
            const cost = calculateLineCost(220200, 'g', 100, 10);
            expect(cost).toBe(2202000);
        });
    });

    describe('toSafeNumber', () => {
        it('parses comma-separated strings', () => {
            expect(toSafeNumber('22,020,020,000')).toBe(22020020000);
        });

        it('returns 0 for invalid values', () => {
            expect(toSafeNumber('abc')).toBe(0);
            expect(toSafeNumber(undefined)).toBe(0);
        });
    });

    describe('calculateMenuMetrics', () => {
        it('calculates expected metrics for normal case', () => {
            const metrics = calculateMenuMetrics(1000, 360);
            expect(metrics.totalCost).toBe(360);
            expect(metrics.grossProfit).toBe(640);
            expect(metrics.costRate).toBe(36);
        });

        it('avoids divide by zero', () => {
            const metrics = calculateMenuMetrics(0, 100);
            expect(metrics.costRate).toBe(0);
        });
    });
});
