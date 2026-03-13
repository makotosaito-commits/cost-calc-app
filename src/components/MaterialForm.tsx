import { useState, useEffect } from 'react';
import { calculateMaterialUnitPrice, toSafeNumber } from '../lib/calculator';
import { InputUnit, Material } from '../types';
import { normalizeInternalUnit, normalizePurchaseQuantity, resolveDisplayValues } from '../lib/materialUnits';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { SegmentedControl } from './ui/SegmentedControl';

type MaterialFormProps = {
    editingMaterial: Material | null;
    onFinishEdit: () => void;
    addMaterial: (material: Omit<Material, 'id'>) => Promise<void>;
    updateMaterial: (id: string, changes: Partial<Material>) => Promise<void>;
};

type FormSnapshot = {
    name: string;
    category: string;
    price: number | null;
    displayQuantity: number | null;
    yieldRate: number | null;
    displayUnit: InputUnit;
};

const createSnapshot = (params: {
    name: string;
    category: string;
    price: number | '';
    displayQuantity: number | '';
    yieldRate: number | '';
    displayUnit: InputUnit;
}): FormSnapshot => ({
    name: params.name,
    category: params.category,
    price: params.price === '' ? null : toSafeNumber(params.price),
    displayQuantity: params.displayQuantity === '' ? null : toSafeNumber(params.displayQuantity),
    yieldRate: params.yieldRate === '' ? null : toSafeNumber(params.yieldRate),
    displayUnit: params.displayUnit,
});

const isSameSnapshot = (a: FormSnapshot | null, b: FormSnapshot | null) => {
    if (!a || !b) return false;
    return (
        a.name === b.name &&
        a.category === b.category &&
        a.price === b.price &&
        a.displayQuantity === b.displayQuantity &&
        a.yieldRate === b.yieldRate &&
        a.displayUnit === b.displayUnit
    );
};

export const MaterialForm = ({ editingMaterial, onFinishEdit, addMaterial, updateMaterial }: MaterialFormProps) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState<number | ''>('');
    const [displayQuantity, setDisplayQuantity] = useState<number | ''>('');
    const [yieldRate, setYieldRate] = useState<number | ''>('');
    const [displayUnit, setDisplayUnit] = useState<InputUnit>('g');
    const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
    const [initialSnapshot, setInitialSnapshot] = useState<FormSnapshot | null>(null);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const resetForm = () => {
        setName('');
        setCategory('');
        setPrice('');
        setDisplayQuantity('');
        setYieldRate('');
        setDisplayUnit('g');
        setInitialSnapshot(null);
    };

    useEffect(() => {
        if (!editingMaterial) {
            setInitialSnapshot(null);
            return;
        }

        setStatusMessage(null);
        const initialName = editingMaterial.name;
        const initialCategory = editingMaterial.category;
        const initialPrice = toSafeNumber(editingMaterial.purchase_price);
        const restored = resolveDisplayValues(editingMaterial);
        const initialDisplayQuantity = restored.displayQuantity;
        const initialYieldRate = editingMaterial.yield_rate === null
            ? ''
            : toSafeNumber(editingMaterial.yield_rate);
        const initialDisplayUnit = restored.displayUnit;

        setName(initialName);
        setCategory(initialCategory);
        setPrice(initialPrice);
        setDisplayQuantity(initialDisplayQuantity);
        setYieldRate(initialYieldRate);
        setDisplayUnit(initialDisplayUnit);
        setInitialSnapshot(createSnapshot({
            name: initialName,
            category: initialCategory,
            price: initialPrice,
            displayQuantity: initialDisplayQuantity,
            yieldRate: initialYieldRate,
            displayUnit: initialDisplayUnit,
        }));
    }, [editingMaterial]);

    useEffect(() => {
        if (!statusMessage) return;

        const timeoutId = window.setTimeout(() => {
            setStatusMessage(null);
        }, 3000);

        return () => window.clearTimeout(timeoutId);
    }, [statusMessage]);

    useEffect(() => {
        if (price && displayQuantity && displayQuantity > 0) {
            const normalizedQty = normalizePurchaseQuantity(displayQuantity, displayUnit);
            const normalizedYieldRate = yieldRate === '' ? null : toSafeNumber(yieldRate);
            const unitPrice = calculateMaterialUnitPrice({
                price: toSafeNumber(price),
                quantity: normalizedQty,
                yieldRate: normalizedYieldRate,
            });
            setCalculatedPrice(unitPrice);
        } else {
            setCalculatedPrice(null);
        }
    }, [price, displayQuantity, displayUnit, yieldRate]);

    const currentSnapshot = editingMaterial
        ? createSnapshot({ name, category, price, displayQuantity, yieldRate, displayUnit })
        : null;
    const isDirty = Boolean(
        editingMaterial &&
        initialSnapshot &&
        currentSnapshot &&
        !isSameSnapshot(initialSnapshot, currentSnapshot)
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !price || !displayQuantity) return;

        if (yieldRate !== '' && (toSafeNumber(yieldRate) <= 0 || toSafeNumber(yieldRate) > 100)) {
            alert('歩留まり（%）は 0より大きく100以下で入力してください。');
            return;
        }

        setStatusMessage(null);

        try {
            const normalizedYieldRate = yieldRate === '' ? null : toSafeNumber(yieldRate);
            const baseUnit = normalizeInternalUnit(displayUnit);
            const normalizedQty = normalizePurchaseQuantity(displayQuantity, displayUnit);
            const normalizedDisplayQuantity = displayQuantity === '' ? null : toSafeNumber(displayQuantity);
            const unitPrice = calculateMaterialUnitPrice({
                price: toSafeNumber(price),
                quantity: normalizedQty,
                yieldRate: normalizedYieldRate,
            });

            if (editingMaterial) {
                await updateMaterial(editingMaterial.id, {
                    name,
                    category,
                    purchase_price: toSafeNumber(price),
                    purchase_quantity: normalizedQty,
                    base_unit: baseUnit,
                    purchase_display_quantity: normalizedDisplayQuantity,
                    purchase_display_unit: displayUnit,
                    yield_rate: normalizedYieldRate,
                    calculated_unit_price: unitPrice,
                });
                setStatusMessage({ type: 'success', text: '歩留まりを反映しました' });
                resetForm();
                onFinishEdit();
                return;
            }

            await addMaterial({
                name,
                category,
                purchase_price: toSafeNumber(price),
                purchase_quantity: normalizedQty,
                base_unit: baseUnit,
                purchase_display_quantity: normalizedDisplayQuantity,
                purchase_display_unit: displayUnit,
                yield_rate: normalizedYieldRate,
                calculated_unit_price: unitPrice,
            });

            resetForm();
        } catch (error) {
            console.error(error);
            setStatusMessage({ type: 'error', text: '更新に失敗しました。時間をおいて再度お試しください。' });
        }
    };

    const handleCancelEdit = () => {
        resetForm();
        onFinishEdit();
    };

    return (
        <Card className="w-full bg-card border-border shadow-xl overflow-visible">
            <CardHeader className="p-4 md:p-6 xl:p-3 pb-3 md:pb-4 xl:pb-2">
                <CardTitle className="text-xl md:text-xl xl:text-lg">材料を登録</CardTitle>
                <p className="text-xs xl:text-[11px] text-muted-foreground">新しい仕入れ情報を入力してください。</p>
            </CardHeader>
            <CardContent className="p-4 md:px-6 md:pt-0 md:pb-3 xl:px-3 xl:pt-0 xl:pb-1.5">
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5 xl:space-y-1.5">
                    {statusMessage && (
                        <p
                            aria-live="polite"
                            className={`rounded-lg border px-2.5 py-1.5 text-[11px] xl:text-[10px] font-medium leading-tight ${
                                statusMessage.type === 'success'
                                    ? 'border-zinc-300 bg-zinc-50 text-zinc-700'
                                    : 'border-destructive/30 bg-destructive/10 text-destructive'
                            }`}
                        >
                            {statusMessage.text}
                        </p>
                    )}

                    <div className="space-y-1.5 xl:space-y-0.5">
                        <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">名前</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="例: 豚肉, 牛乳, 卵..."
                            required
                            className="bg-background border-border placeholder:text-muted-foreground/50 h-11 xl:h-8"
                        />
                    </div>

                    <div className="space-y-1.5 xl:space-y-0.5">
                        <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">カテゴリ</label>
                        <Input
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="例: 肉類, 飲料..."
                            className="bg-background border-border placeholder:text-muted-foreground/50 h-11 xl:h-8"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 xl:gap-2">
                        <div className="space-y-1.5 xl:space-y-0.5">
                            <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">仕入価格 (円)</label>
                            <Input
                                type="number"
                                value={price}
                                onChange={(e) => {
                                    const raw = e.target.value;
                                    setPrice(raw === '' ? '' : toSafeNumber(raw));
                                }}
                                placeholder="1000"
                                required
                                min="0"
                                className="bg-background border-border h-11 xl:h-8"
                            />
                        </div>
                        <div className="space-y-1.5 xl:space-y-0.5">
                            <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">仕入数量</label>
                            <Input
                                type="number"
                                value={displayQuantity}
                                onChange={(e) => {
                                    const raw = e.target.value;
                                    setDisplayQuantity(raw === '' ? '' : toSafeNumber(raw));
                                }}
                                placeholder="1"
                                required
                                step="any"
                                min="0"
                                className="bg-background border-border h-11 xl:h-8"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5 xl:space-y-0.5">
                        <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">歩留まり（%）</label>
                        <Input
                            type="number"
                            value={yieldRate}
                            onChange={(e) => {
                                const raw = e.target.value;
                                setYieldRate(raw === '' ? '' : toSafeNumber(raw));
                            }}
                            placeholder="例: 80"
                            step="any"
                            min="0.01"
                            max="100"
                            className="bg-background border-border h-11 xl:h-8"
                        />
                        <p className="text-xs xl:text-[9px] text-muted-foreground pl-1 leading-tight xl:whitespace-nowrap">
                            任意入力。未入力は100%で計算します。
                        </p>
                    </div>

                    <div className="space-y-1.5 xl:space-y-0.5">
                        <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">単位</label>
                        <SegmentedControl
                            options={['g', 'kg', 'ml', '個']}
                            value={displayUnit}
                            onChange={(value) => setDisplayUnit(value as InputUnit)}
                            className="w-full bg-background border border-border h-10 xl:h-8"
                        />
                    </div>

                    <div className="relative pt-4 xl:pt-1.5 overflow-visible">
                        {calculatedPrice !== null && (
                            <div className="absolute -top-2 right-0 left-0 flex justify-center pointer-events-none">
                                <div className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full shadow-lg translate-y-[-50%]">
                                    基準単価を算出しました
                                </div>
                            </div>
                        )}
                        <div className={`rounded-xl border border-border px-4 py-3 xl:px-2.5 xl:py-2 transition-all duration-300 ${calculatedPrice !== null ? 'bg-background opacity-100' : 'bg-transparent opacity-30 select-none'}`}>
                            <p className="text-center text-sm font-bold text-foreground">
                                {calculatedPrice !== null ? Math.round(calculatedPrice).toLocaleString() : '0'} <span className="text-xs font-normal text-muted-foreground">円 / {normalizeInternalUnit(displayUnit)}</span>
                            </p>
                        </div>
                        {editingMaterial && (
                            <p className="mt-2 xl:mt-1 text-xs xl:text-[9px] text-muted-foreground leading-[1.25]">
                                これは保存前のプレビューです。反映するには「この内容で更新」を押してください。
                            </p>
                        )}
                    </div>

                    {editingMaterial ? (
                        <div className="grid grid-cols-2 gap-3 xl:gap-1.5">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleCancelEdit}
                                className="w-full font-black uppercase tracking-widest h-12 xl:h-9"
                            >
                                編集をキャンセル
                            </Button>
                            <Button
                                type="submit"
                                disabled={!isDirty}
                                className={`w-full font-black uppercase tracking-widest h-12 xl:h-9 transition-all ${
                                    isDirty ? 'ring-2 ring-zinc-900/60 shadow-lg' : ''
                                }`}
                            >
                                この内容で更新
                            </Button>
                        </div>
                    ) : (
                        <Button type="submit" className="w-full font-black uppercase tracking-widest h-12 xl:h-9">
                            この内容で登録
                        </Button>
                    )}
                </form>
            </CardContent>
        </Card>
    );
};
