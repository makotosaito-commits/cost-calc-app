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

export const MaterialForm = ({ editingMaterial, onFinishEdit, addMaterial, updateMaterial }: MaterialFormProps) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState<number | ''>('');
    const [displayQuantity, setDisplayQuantity] = useState<number | ''>('');
    const [yieldRate, setYieldRate] = useState<number | ''>('');
    const [displayUnit, setDisplayUnit] = useState<InputUnit>('g');
    const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

    const resetForm = () => {
        setName('');
        setCategory('');
        setPrice('');
        setDisplayQuantity('');
        setYieldRate('');
        setDisplayUnit('g');
    };

    useEffect(() => {
        if (!editingMaterial) {
            return;
        }

        setName(editingMaterial.name);
        setCategory(editingMaterial.category);
        setPrice(toSafeNumber(editingMaterial.purchase_price));
        const restored = resolveDisplayValues(editingMaterial);
        setDisplayQuantity(restored.displayQuantity);
        setYieldRate(
            editingMaterial.yield_rate === null || editingMaterial.yield_rate === undefined
                ? ''
                : toSafeNumber(editingMaterial.yield_rate)
        );
        setDisplayUnit(restored.displayUnit);
    }, [editingMaterial]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !price || !displayQuantity) return;

        if (yieldRate !== '' && (toSafeNumber(yieldRate) <= 0 || toSafeNumber(yieldRate) > 100)) {
            alert('歩留まり（%）は 0より大きく100以下で入力してください。');
            return;
        }

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
    };

    const handleCancelEdit = () => {
        resetForm();
        onFinishEdit();
    };

    return (
        <Card className="w-full bg-card border-border shadow-xl overflow-visible">
            <CardHeader className="p-4 md:p-6 pb-3 md:pb-4">
                <CardTitle className="text-xl md:text-xl">材料を登録</CardTitle>
                <p className="text-xs text-muted-foreground">新しい仕入れ情報を入力してください。</p>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">名前</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="例: 豚肉, 牛乳, 卵..."
                            required
                            className="bg-background border-border placeholder:text-muted-foreground/50"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">カテゴリ</label>
                        <Input
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="例: 肉類, 飲料..."
                            className="bg-background border-border placeholder:text-muted-foreground/50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
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
                                className="bg-background border-border"
                            />
                        </div>
                        <div className="space-y-1.5">
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
                                className="bg-background border-border"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
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
                            className="bg-background border-border"
                        />
                        <p className="text-xs text-muted-foreground pl-1">
                            任意入力です。未入力の場合は100%で計算されます。
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">単位</label>
                        <SegmentedControl
                            options={['g', 'kg', 'ml', '個']}
                            value={displayUnit}
                            onChange={(value) => setDisplayUnit(value as InputUnit)}
                            className="w-full bg-background border border-border"
                        />
                    </div>

                    <div className="relative pt-4 overflow-visible">
                        {calculatedPrice !== null && (
                            <div className="absolute -top-2 right-0 left-0 flex justify-center pointer-events-none">
                                <div className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full shadow-lg translate-y-[-50%]">
                                    基準単価を算出しました
                                </div>
                            </div>
                        )}
                        <div className={`rounded-xl border border-border p-4 transition-all duration-300 ${calculatedPrice !== null ? 'bg-background opacity-100' : 'bg-transparent opacity-30 select-none'}`}>
                            <p className="text-center text-sm font-bold text-foreground">
                                {calculatedPrice !== null ? Math.round(calculatedPrice).toLocaleString() : '0'} <span className="text-xs font-normal text-muted-foreground">円 / {normalizeInternalUnit(displayUnit)}</span>
                            </p>
                        </div>
                    </div>

                    {editingMaterial ? (
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleCancelEdit}
                                className="w-full font-black uppercase tracking-widest h-12"
                            >
                                編集をキャンセル
                            </Button>
                            <Button type="submit" className="w-full font-black uppercase tracking-widest h-12">
                                この内容で更新
                            </Button>
                        </div>
                    ) : (
                        <Button type="submit" className="w-full font-black uppercase tracking-widest h-12">
                            この内容で登録
                        </Button>
                    )}
                </form>
            </CardContent>
        </Card>
    );
};
