import { useState, useEffect, useRef } from 'react';
import { Menu } from '../types';

import { Input } from './ui/Input';
import { Card, CardContent } from './ui/Card';

interface MenuDetailProps {
    menu: Menu;
    onUpdate: (id: string, changes: Partial<Menu>) => Promise<void>;
    calculatedTotalCost: number;
}

export const MenuDetail = ({ menu, onUpdate, calculatedTotalCost }: MenuDetailProps) => {
    const [name, setName] = useState(menu.name);
    const [salesPrice, setSalesPrice] = useState(menu.sales_price > 0 ? String(menu.sales_price) : '');
    const [image, setImage] = useState<string | undefined>(menu.image);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setName(menu.name);
        setSalesPrice(menu.sales_price > 0 ? String(menu.sales_price) : '');
        setImage(menu.image);
    }, [menu]);

    const handleSave = async (updates: Partial<Menu> = {}) => {
        const parsedSalesPrice = salesPrice.trim() === '' ? 0 : Number(salesPrice);

        await onUpdate(menu.id, {
            name,
            sales_price: parsedSalesPrice,
            image,
            ...updates
        });
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

    const hasSalesPrice = salesPrice.trim() !== '';
    const numericSalesPrice = hasSalesPrice ? Number(salesPrice) : 0;
    const grossProfit = numericSalesPrice - calculatedTotalCost;
    const costRate = numericSalesPrice > 0 ? (calculatedTotalCost / numericSalesPrice) * 100 : 0;

    return (
        <div className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800 shadow-2xl overflow-visible">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Image Upload Section */}
                        <div className="order-2 md:order-1 flex justify-center md:block">
                            <div
                                className="relative w-full aspect-video bg-zinc-950 rounded-xl border-2 border-dashed border-zinc-800 flex items-center justify-center overflow-hidden cursor-pointer hover:border-zinc-600 transition-colors group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {image ? (
                                    <img src={image} alt="Menu" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center text-zinc-600 group-hover:text-zinc-400 transition-colors">
                                        <PhotoIcon className="h-10 w-10 mx-auto mb-2" />
                                        <span className="text-xs font-bold uppercase tracking-wider">写真を追加</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white text-xs font-bold uppercase tracking-wider border border-white px-3 py-1 rounded-full">
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

                        <div className="order-1 md:order-2 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">メニュー名</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onBlur={() => handleSave()}
                                    className="text-xl font-bold bg-transparent border-t-0 border-l-0 border-r-0 border-b-2 border-zinc-800 rounded-none focus-visible:ring-0 focus-visible:border-primary transition-all px-1"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">販売価格 (円)</label>
                                <div className="relative group">
                                    <span className="absolute left-1 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">¥</span>
                                    <Input
                                        type="number"
                                        value={salesPrice}
                                        onChange={(e) => setSalesPrice(e.target.value)}
                                        onBlur={() => handleSave()}
                                        placeholder="例: 850"
                                        className="text-2xl font-black bg-transparent border-t-0 border-l-0 border-r-0 border-b-2 border-zinc-800 rounded-none focus-visible:ring-0 focus-visible:border-primary transition-all pl-5 pr-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 mt-8">
                                <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/50 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">原価合計</p>
                                        <p className="text-2xl font-black text-foreground">{Math.round(calculatedTotalCost).toLocaleString()} <span className="text-xs font-normal">円</span></p>
                                    </div>
                                    <div className="h-10 w-10 flex items-center justify-center bg-zinc-800 rounded-lg text-muted-foreground">
                                        <ReceiptIcon />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/50">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">粗利益</p>
                                        <p className={`text-xl font-black ${hasSalesPrice ? (grossProfit >= 0 ? 'text-green-500' : 'text-red-500') : 'text-muted-foreground'}`}>
                                            {hasSalesPrice ? Math.round(grossProfit).toLocaleString() : '—'} <span className="text-xs font-normal">円</span>
                                        </p>
                                    </div>
                                    <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/50">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">原価率</p>
                                        <p className={`text-xl font-black ${hasSalesPrice ? (costRate <= 30 ? 'text-green-500' : (costRate <= 45 ? 'text-yellow-500' : 'text-red-500')) : 'text-muted-foreground'}`}>
                                            {hasSalesPrice ? costRate.toFixed(1) : '—'} <span className="text-xs font-normal">%</span>
                                        </p>
                                    </div>
                                </div>
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
