

/**
 * 仕入れ値と数量から単価を計算する
 * @param price 仕入れ値 (円)
 * @param qty 仕入れ数量
 * @returns 単価 (円/単位)
 */
export const calculateUnitPrice = (price: number, qty: number): number => {
    if (qty <= 0) return 0;
    return price / qty;
};

/**
 * 単位を変換して基準単位(g, ml, 個)での数量を返す
 * @param amount 数量
 * @param unit 単位文字列
 * @returns 正規化された数量 (失敗時はamountをそのまま返すか、エラーとするが今回は簡易実装)
 */
export const normalizeAmount = (amount: number, unit: string): number => {
    // 小文字に統一して判定
    const u = unit.toLowerCase();

    if (u === 'kg') return amount * 1000;
    if (u === 'l') return amount * 1000;

    // NOTE: g->kg 0.001倍などの逆変換はこの関数が必要とされる文脈(Recipe使用量 -> BaseUnit)では
    // あまり発生しないが、仕様通り実装するなら "g" 等はそのまま、"mg"なら0.001など
    // ここでは "g", "ml", "個" は変換係数1とする

    return amount;
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
    if (yieldRate <= 0) return 0; // 歩留まり0以下は計算不可

    // 1. 実質使用量 = 使用量 / (歩留まり% / 100)
    const realUsage = usageAmount / (yieldRate / 100);

    // 2. 実質使用量を正規化 (例: kg -> g)
    const normalizedRealUsage = normalizeAmount(realUsage, usageUnit);

    // 3. コスト = 実質使用量(正規化後) * 基準単価
    return normalizedRealUsage * baseUnitPrice;
};
