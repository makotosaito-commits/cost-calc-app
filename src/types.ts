export type BaseUnit = 'g' | 'ml' | '個' | '枚';
export type InputUnit = 'g' | 'kg' | 'ml' | '個' | '枚';

export interface Material {
    id: string;
    name: string;
    category: string;
    purchase_price: number;
    purchase_quantity: number;
    // 仕入詳細表示用の数量・単位（未設定時は purchase_quantity/base_unit を使用）
    purchase_display_quantity?: number | null;
    purchase_display_unit?: InputUnit | null;
    base_unit: BaseUnit;
    // 材料の歩留まり (%)。未入力は null として扱い、計算時に 100% 扱いとする
    yield_rate?: number | null;
    // 自動計算される単価 (円/base_unit)
    calculated_unit_price?: number;
}

export interface Menu {
    id: string;
    user_id: string;
    name: string;
    sales_price: number;
    total_cost: number;
    gross_profit: number; // 粗利
    cost_rate: number; // 原価率 (%)
    image?: string; // Data URL for the menu photo
}

export interface Recipe {
    id: string;
    user_id: string;
    menu_id: string;
    material_id: string;
    usage_amount: number;
    usage_unit: string; // 表示用単位 (例: kg, L) - ただし計算時はnormalizeが必要
    yield_rate: number; // 歩留まり (%) - default 100
}
