export const COST_RATE_SETTINGS_KEY = 'costCalcSettings';

export interface CostRateSettings {
    targetCostRate: number;
    warnCostRate: number;
    dangerCostRate: number;
}

export const DEFAULT_COST_RATE_SETTINGS: CostRateSettings = {
    targetCostRate: 30,
    warnCostRate: 35,
    dangerCostRate: 40,
};

const clampPercent = (value: number) => {
    if (!Number.isFinite(value)) return 0;
    if (value < 0) return 0;
    if (value > 100) return 100;
    return value;
};

export const sanitizeCostRateSettings = (value: Partial<CostRateSettings> | null | undefined): CostRateSettings => {
    const target = clampPercent(value?.targetCostRate ?? DEFAULT_COST_RATE_SETTINGS.targetCostRate);
    const warn = clampPercent(value?.warnCostRate ?? DEFAULT_COST_RATE_SETTINGS.warnCostRate);
    const danger = clampPercent(value?.dangerCostRate ?? DEFAULT_COST_RATE_SETTINGS.dangerCostRate);

    const orderedWarn = Math.max(target, warn);
    const orderedDanger = Math.max(orderedWarn, danger);

    return {
        targetCostRate: target,
        warnCostRate: orderedWarn,
        dangerCostRate: orderedDanger,
    };
};

export const loadCostRateSettings = (): CostRateSettings => {
    if (typeof window === 'undefined') return DEFAULT_COST_RATE_SETTINGS;

    try {
        const raw = window.localStorage.getItem(COST_RATE_SETTINGS_KEY);
        if (!raw) return DEFAULT_COST_RATE_SETTINGS;
        const parsed = JSON.parse(raw) as Partial<CostRateSettings>;
        return sanitizeCostRateSettings(parsed);
    } catch {
        return DEFAULT_COST_RATE_SETTINGS;
    }
};

export const saveCostRateSettings = (settings: CostRateSettings) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(COST_RATE_SETTINGS_KEY, JSON.stringify(settings));
};

export type CostRateTone = 'none' | 'good' | 'warn' | 'danger';

export interface EvaluatedCostRate {
    displayRate: string | null;
    label: '良い' | '注意' | '高い' | null;
    tone: CostRateTone;
    overWarnThreshold: boolean;
}

export const evaluateCostRate = (
    costRate: unknown,
    salesPrice: unknown,
    settings: CostRateSettings
): EvaluatedCostRate => {
    const numericSalesPrice = Number(salesPrice);
    const numericCostRate = Number(costRate);
    const valid = Number.isFinite(numericSalesPrice)
        && numericSalesPrice > 0
        && Number.isFinite(numericCostRate);

    if (!valid) {
        return {
            displayRate: null,
            label: null,
            tone: 'none',
            overWarnThreshold: false,
        };
    }

    const roundedRate = Math.round(numericCostRate * 10) / 10;
    if (roundedRate >= settings.dangerCostRate) {
        return {
            displayRate: roundedRate.toFixed(1),
            label: '高い',
            tone: 'danger',
            overWarnThreshold: true,
        };
    }

    if (roundedRate > settings.targetCostRate) {
        return {
            displayRate: roundedRate.toFixed(1),
            label: '注意',
            tone: 'warn',
            overWarnThreshold: roundedRate >= settings.warnCostRate,
        };
    }

    return {
        displayRate: roundedRate.toFixed(1),
        label: '良い',
        tone: 'good',
        overWarnThreshold: false,
    };
};
