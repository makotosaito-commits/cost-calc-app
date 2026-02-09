import { useState, useEffect } from 'react';
import { useMaterials } from '../hooks/useMaterials';
import { calculateUnitPrice, normalizeAmount, toSafeNumber } from '../lib/calculator';
import { BaseUnit } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { SegmentedControl } from './ui/SegmentedControl';

export const MaterialForm = () => {
    const { addMaterial } = useMaterials();
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState<number | ''>('');
    const [quantity, setQuantity] = useState<number | ''>('');
    const [inputUnit, setInputUnit] = useState('g');
    const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

    useEffect(() => {
        if (price && quantity && quantity > 0) {
            const normalizedQty = normalizeAmount(toSafeNumber(quantity), inputUnit);
            const unitPrice = calculateUnitPrice(toSafeNumber(price), normalizedQty);
            setCalculatedPrice(unitPrice);
        } else {
            setCalculatedPrice(null);
        }
    }, [price, quantity, inputUnit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !price || !quantity) return;

        let baseUnit: BaseUnit = 'g';
        if (inputUnit === 'ml') baseUnit = 'ml';
        if (inputUnit === '個') baseUnit = '個';

        const normalizedQty = normalizeAmount(toSafeNumber(quantity), inputUnit);
        const unitPrice = calculateUnitPrice(toSafeNumber(price), normalizedQty);

        await addMaterial({
            name,
            category,
            purchase_price: toSafeNumber(price),
            purchase_quantity: normalizedQty,
            base_unit: baseUnit,
            calculated_unit_price: unitPrice,
        });

        setName('');
        setCategory('');
        setPrice('');
        setQuantity('');
        setInputUnit('g');
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
                                value={quantity}
                                onChange={(e) => {
                                    const raw = e.target.value;
                                    setQuantity(raw === '' ? '' : toSafeNumber(raw));
                                }}
                                placeholder="1"
                                required
                                min="0"
                                className="bg-background border-border"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">単位</label>
                        <SegmentedControl
                            options={['g', 'ml', '個']}
                            value={inputUnit}
                            onChange={setInputUnit}
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
                                {calculatedPrice !== null ? calculatedPrice.toFixed(3) : '0.000'} <span className="text-xs font-normal text-muted-foreground">円 / {inputUnit === '個' ? '個' : inputUnit}</span>
                            </p>
                        </div>
                    </div>

                    <Button type="submit" className="w-full font-black uppercase tracking-widest h-12">
                        この内容で登録
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};
