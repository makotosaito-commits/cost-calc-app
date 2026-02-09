import { useState, useEffect, useRef } from 'react';
import { Menu } from '../types';

import { useCostRateSettings } from '../contexts/CostRateSettingsContext';
import { Input } from './ui/Input';
import { Card, CardContent } from './ui/Card';
import { calculateMenuMetrics, toSafeNumber } from '../lib/calculator';
import { evaluateCostRate } from '../lib/costRateSettings';

interface MenuDetailProps {
    menu: Menu;
    onUpdate: (id: string, changes: Partial<Menu>) => Promise<void>;
    calculatedTotalCost: number;
}

export const MenuDetail = ({ menu, onUpdate, calculatedTotalCost }: MenuDetailProps) => {
    const { settings } = useCostRateSettings();
    const [name, setName] = useState(menu.name);
    const [salesPrice, setSalesPrice] = useState<number | null>(toSafeNumber(menu.sales_price) > 0 ? toSafeNumber(menu.sales_price) : null);
    const [image, setImage] = useState<string | undefined>(menu.image);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setName(menu.name);
        setSalesPrice(toSafeNumber(menu.sales_price) > 0 ? toSafeNumber(menu.sales_price) : null);
        setImage(menu.image);
    }, [menu]);

    const handleSave = async (updates: Partial<Menu> = {}) => {
        await onUpdate(menu.id, updates);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setImage(base64);
                handleSave({ image: base64 });
            };
            reader.readAsDataURL(file);
        }
    };

    const hasSalesPrice = salesPrice !== null && salesPrice > 0;
    const { grossProfit, costRate } = calculateMenuMetrics(salesPrice ?? 0, calculatedTotalCost);
    const evaluated = evaluateCostRate(costRate, salesPrice ?? 0, settings);
    const safeTotalCost = Number.isFinite(calculatedTotalCost) ? Math.round(calculatedTotalCost) : null;
    const safeGrossProfit = hasSalesPrice && Number.isFinite(grossProfit) ? Math.round(grossProfit) : null;
    const rateToneClass = evaluated.tone === 'none'
        ? 'text-muted-foreground border-border bg-muted/40'
        : evaluated.tone === 'good'
            ? 'text-zinc-700 border-zinc-400/50 bg-zinc-100'
            : evaluated.tone === 'warn'
                ? 'text-zinc-800 border-zinc-500/50 bg-zinc-200'
                : 'text-zinc-900 border-zinc-600/60 bg-zinc-300';
    const rateLabel = evaluated.label ?? '未入力';

    return (
        <div className="space-y-4">
            <Card className="bg-card border-border shadow-sm overflow-visible">
                <CardContent className="p-6">
                    <div className="space-y-6">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">概要</p>
                        <div className="flex justify-center md:block">
                            <div
                                className="relative w-full aspect-video bg-muted rounded-xl border border-dashed border-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-zinc-400 transition-colors group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {image ? (
                                    <img src={image} alt="Menu" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center text-muted-foreground transition-colors">
                                        <PhotoIcon className="h-10 w-10 mx-auto mb-2" />
                                        <span className="text-xs font-bold uppercase tracking-wider">写真を追加</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-foreground text-xs font-medium uppercase tracking-wider border border-border px-3 py-1 rounded-full">
                                        {image ? '変更する' : 'アップロード'}
                                    </span>
                                </div>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                            />
                        </div>

                        <div className="mt-3 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">メニュー名</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onBlur={() => {
                                        const trimmedName = name.trim();
                                        if (trimmedName) {
                                            setName(trimmedName);
                                            handleSave({ name: trimmedName });
                                        }
                                    }}
                                    placeholder="例: 牛すじ煮込み"
                                    className="text-lg font-semibold bg-transparent border-t-0 border-l-0 border-r-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-foreground transition-all px-1"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">販売価格 (円)</label>
                                <div className="relative group">
                                    <span className="absolute left-1 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={salesPrice ?? ''}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/[^\d]/g, '');
                                            setSalesPrice(raw === '' ? null : toSafeNumber(raw));
                                        }}
                                        onBlur={() => {
                                            const parsedSalesPrice = salesPrice ?? 0;
                                            handleSave({ sales_price: parsedSalesPrice });
                                        }}
                                        placeholder="例: 850"
                                        className="text-xl font-semibold bg-transparent border-t-0 border-l-0 border-r-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-foreground transition-all pl-5 pr-1"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
                <CardContent className="p-6 space-y-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">結果</p>
                    <div className={`rounded-xl border p-4 ${rateToneClass}`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">原価率</p>
                                <p className="mt-1 text-4xl font-black leading-none tabular-nums">
                                    {evaluated.displayRate ?? '—'}
                                    <span className="ml-1 text-lg font-bold">%</span>
                                </p>
                            </div>
                            <span className="text-[11px] font-medium tracking-wide rounded-full px-2 py-1 border border-current/30 bg-background/50">
                                {rateLabel}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/40 rounded-xl p-4 border border-border">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">粗利益</p>
                            <p className={`text-xl font-semibold tabular-nums ${hasSalesPrice ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {safeGrossProfit !== null ? safeGrossProfit.toLocaleString() : '—'} <span className="text-xs font-normal">円</span>
                            </p>
                        </div>
                        <div className="bg-muted/40 rounded-xl p-4 border border-border flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">原価合計</p>
                                <p className="text-xl font-black text-foreground tabular-nums">{safeTotalCost !== null ? safeTotalCost.toLocaleString() : '—'} <span className="text-xs font-normal">円</span></p>
                            </div>
                            <div className="h-9 w-9 flex items-center justify-center bg-background border border-border rounded-lg text-muted-foreground">
                                <ReceiptIcon />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const ReceiptIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17.5V6.5" /></svg>
);

const PhotoIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
);
