import { toSafeNumber } from './calculator';
import { BaseUnit, InputUnit, Material } from '../types';

const INPUT_UNITS: InputUnit[] = ['g', 'kg', 'ml', '個', '枚'];

export const sanitizeDisplayUnit = (raw: unknown): InputUnit | null => {
    if (typeof raw !== 'string') return null;
    const normalized = raw.trim();
    return INPUT_UNITS.includes(normalized as InputUnit) ? normalized as InputUnit : null;
};

export const sanitizeBaseUnit = (raw: unknown, legacyUnit?: unknown): BaseUnit => {
    const primary = typeof raw === 'string' ? raw.trim() : '';
    const fallback = typeof legacyUnit === 'string' ? legacyUnit.trim() : '';
    const candidate = primary || fallback;

    if (candidate === 'g' || candidate === 'ml' || candidate === '個' || candidate === '枚') return candidate;
    if (candidate === 'kg') return 'g';
    return 'g';
};

export const normalizeInternalUnit = (displayUnit: InputUnit): BaseUnit => {
    return displayUnit === 'kg' ? 'g' : displayUnit;
};

export const normalizePurchaseQuantity = (quantity: unknown, displayUnit: InputUnit): number => {
    const numericQuantity = toSafeNumber(quantity);
    if (numericQuantity <= 0) return 0;
    if (displayUnit === 'kg') return numericQuantity * 1000;
    return numericQuantity;
};

export const getSafePurchaseQuantityForCalc = (quantity: unknown): number => {
    const numericQuantity = toSafeNumber(quantity);
    return numericQuantity > 0 ? numericQuantity : 1;
};

export const resolveDisplayValues = (
    material: Pick<Material, 'purchase_quantity' | 'base_unit' | 'purchase_display_quantity' | 'purchase_display_unit'> & {
        unit?: unknown;
    }
) => {
    const rawDisplayUnit = sanitizeDisplayUnit(material.purchase_display_unit);
    const displayFromBase = sanitizeDisplayUnit(material.base_unit);
    const displayFromLegacy = sanitizeDisplayUnit(material.unit);
    const safeBaseUnit = sanitizeBaseUnit(material.base_unit, material.unit);
    const displayUnit = rawDisplayUnit ?? displayFromBase ?? displayFromLegacy ?? safeBaseUnit;
    const displayQuantityRaw =
        material.purchase_display_quantity === null || material.purchase_display_quantity === undefined
            ? toSafeNumber(material.purchase_quantity)
            : toSafeNumber(material.purchase_display_quantity);
    const fallbackQuantity = toSafeNumber(material.purchase_quantity);
    const displayQuantity = displayQuantityRaw > 0
        ? displayQuantityRaw
        : (fallbackQuantity > 0 ? fallbackQuantity : 1);

    return {
        displayQuantity,
        displayUnit,
    };
};
