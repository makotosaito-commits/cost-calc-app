import { toSafeNumber } from './calculator';
import { BaseUnit, InputUnit, Material } from '../types';

const INPUT_UNITS: InputUnit[] = ['g', 'kg', 'ml', '個'];

export const sanitizeDisplayUnit = (raw: unknown): InputUnit | null => {
    if (typeof raw !== 'string') return null;
    const normalized = raw.trim();
    return INPUT_UNITS.includes(normalized as InputUnit) ? normalized as InputUnit : null;
};

export const sanitizeBaseUnit = (raw: unknown): BaseUnit => {
    if (raw === 'g' || raw === 'ml' || raw === '個') return raw;
    if (raw === 'kg') return 'g';
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

export const resolveDisplayValues = (
    material: Pick<Material, 'purchase_quantity' | 'base_unit' | 'purchase_display_quantity' | 'purchase_display_unit'>
) => {
    const displayUnit = sanitizeDisplayUnit(material.purchase_display_unit) ?? sanitizeBaseUnit(material.base_unit);
    const displayQuantity =
        material.purchase_display_quantity === null || material.purchase_display_quantity === undefined
            ? toSafeNumber(material.purchase_quantity)
            : toSafeNumber(material.purchase_display_quantity);

    return {
        displayQuantity,
        displayUnit,
    };
};
