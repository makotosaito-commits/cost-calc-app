
/**
 * Safely convert unknown input to number.
 * - strings: remove commas and parseFloat
 * - NaN / Infinity / undefined / null: fallback to 0
 */
export const toSafeNumber = (value: unknown): number => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }
    if (typeof value === 'string') {
        const normalized = value.replace(/,/g, '').trim();
        if (!normalized) return 0;
        const parsed = Number.parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
};


/**
 * 仕入れ値と数量から単価を計算する
 * @param price 仕入れ値 (円)
 * @param qty 仕入れ数量
 * @returns 単価 (円/単位)
 */
export const calculateUnitPrice = (price: number, qty: number): number => {
    const numericPrice = toSafeNumber(price);
    const numericQty = toSafeNumber(qty);
    if (numericQty <= 0) return 0;
    return numericPrice / numericQty;
};

/**
 * 歩留まり(%)を正規化する。
 * - 未入力/不正値/範囲外: 100
 * - 有効範囲: 0 より大きく 100 以下
 */
export const normalizeYieldRate = (yieldRate: unknown): number => {
    const numericYieldRate = toSafeNumber(yieldRate);
    if (numericYieldRate <= 0 || numericYieldRate > 100) return 100;
    return numericYieldRate;
};

/**
 * 歩留まりを考慮した基準単価を計算する
 * 基準単価 = 価格 ÷ (数量 × 歩留まり ÷ 100)
 */
export const calculateUnitPriceWithYield = (
    price: unknown,
    qty: unknown,
    yieldRate?: unknown
): number => {
    const numericPrice = toSafeNumber(price);
    const numericQty = toSafeNumber(qty);
    const normalizedYieldRate = normalizeYieldRate(yieldRate);
    const effectiveQty = numericQty * (normalizedYieldRate / 100);
    if (effectiveQty <= 0) return 0;
    return numericPrice / effectiveQty;
};

type MaterialUnitPriceParams = {
    price: unknown;
    quantity: unknown;
    yieldRate?: unknown;
    fallback?: unknown;
};

/**
 * 材料の基準単価を安全に計算する。
 * - yieldRate が undefined の場合は「列未取得」とみなし fallback を優先
 * - yieldRate が null の場合は 100% 扱い
 */
export const calculateMaterialUnitPrice = ({
    price,
    quantity,
    yieldRate,
    fallback,
}: MaterialUnitPriceParams): number => {
    let resolvedYieldRate = yieldRate;

    if (yieldRate === undefined) {
        const fallbackPrice = toSafeNumber(fallback);
        if (fallbackPrice > 0) {
            return fallbackPrice;
        }
        resolvedYieldRate = null;
    }

    const numericQuantity = toSafeNumber(quantity);
    if (numericQuantity <= 0) {
        return toSafeNumber(fallback);
    }

    return calculateUnitPriceWithYield(price, numericQuantity, resolvedYieldRate);
};

/**
 * yield_rate が取得できない環境向けに、保存済みの単価から歩留まりを推定する。
 * inferredYield = price / (quantity * unitPrice) * 100
 * - 推定不能/範囲外: null
 * - 100%相当(誤差以内): null（未設定互換）
 */
export const inferYieldRateFromUnitPrice = (
    price: unknown,
    quantity: unknown,
    unitPrice: unknown,
    nearHundredTolerance = 0.01
): number | null => {
    const numericPrice = toSafeNumber(price);
    const numericQuantity = toSafeNumber(quantity);
    const numericUnitPrice = toSafeNumber(unitPrice);

    if (numericPrice <= 0 || numericQuantity <= 0 || numericUnitPrice <= 0) {
        return null;
    }

    const inferred = (numericPrice / (numericQuantity * numericUnitPrice)) * 100;
    if (!Number.isFinite(inferred) || inferred <= 0 || inferred > 100) {
        return null;
    }

    if (Math.abs(inferred - 100) <= nearHundredTolerance) {
        return null;
    }

    return inferred;
};

/**
 * 単位を変換して基準単位(g, ml, 個)での数量を返す
 * @param amount 数量
 * @param unit 単位文字列
 * @returns 正規化された数量 (失敗時はamountをそのまま返すか、エラーとするが今回は簡易実装)
 */
export const normalizeAmount = (amount: number, unit: string): number => {
    const numericAmount = toSafeNumber(amount);
    if (numericAmount <= 0) return 0;

    // 小文字に統一して判定
    const u = unit.toLowerCase();

    if (u === 'kg') return numericAmount * 1000;
    if (u === 'l') return numericAmount * 1000;

    // NOTE: g->kg 0.001倍などの逆変換はこの関数が必要とされる文脈(Recipe使用量 -> BaseUnit)では
    // あまり発生しないが、仕様通り実装するなら "g" 等はそのまま、"mg"なら0.001など
    // ここでは "g", "ml", "個" は変換係数1とする

    return numericAmount;
};

/**
 * レシピ1行あたりの原価を計算する
 * @param usageAmount レシピ使用量
 * @param usageUnit レシピ使用単位
 * @param yieldRate 歩留まり (%)
 * @param baseUnitPrice 基準単価 (円/BaseUnit)
 * @returns 計算された原価
 */
export const calculateLineCost = (
    usageAmount: number,
    usageUnit: string,
    yieldRate: number,
    baseUnitPrice: number
): number => {
    const numericYieldRate = toSafeNumber(yieldRate);
    const numericBaseUnitPrice = toSafeNumber(baseUnitPrice);
    const numericUsageAmount = toSafeNumber(usageAmount);

    if (numericYieldRate <= 0 || numericBaseUnitPrice <= 0 || numericUsageAmount <= 0) return 0;

    // 1. 実質使用量 = 使用量 / (歩留まり% / 100)
    const realUsage = numericUsageAmount / (numericYieldRate / 100);

    // 2. 実質使用量を正規化 (例: kg -> g)
    const normalizedRealUsage = normalizeAmount(realUsage, usageUnit);

    // 3. コスト = 実質使用量(正規化後) * 基準単価
    return normalizedRealUsage * numericBaseUnitPrice;
};

export const calculateMenuMetrics = (salesPrice: unknown, totalCost: unknown) => {
    const numericSalesPrice = toSafeNumber(salesPrice);
    const numericTotalCost = toSafeNumber(totalCost);
    const grossProfit = numericSalesPrice - numericTotalCost;
    const costRate = numericSalesPrice > 0 ? (numericTotalCost / numericSalesPrice) * 100 : 0;

    return {
        salesPrice: numericSalesPrice,
        totalCost: numericTotalCost,
        grossProfit,
        costRate,
    };
};
