import { useEffect, useState } from 'react';
import { useMenus } from '../hooks/useMenus';
import { MenuDetail } from './MenuDetail';
import { RecipeEditor } from './RecipeEditor';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { calculateMenuMetrics, toSafeNumber } from '../lib/calculator';

export const MenuPage = () => {
    const { menus, addMenu, updateMenu, deleteMenu } = useMenus();
    const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
    const selectedMenu = selectedMenuId ? menus.find(m => m.id === selectedMenuId) : null;
    const [desktopName, setDesktopName] = useState('');
    const [desktopSalesPrice, setDesktopSalesPrice] = useState<number | null>(null);

    useEffect(() => {
        if (!selectedMenu) return;
        setDesktopName(selectedMenu.name);
        setDesktopSalesPrice(toSafeNumber(selectedMenu.sales_price) > 0 ? toSafeNumber(selectedMenu.sales_price) : null);
    }, [selectedMenu?.id, selectedMenu?.name, selectedMenu?.sales_price]);

    const handleAddMenu = async () => {
        await addMenu({
            name: '',
            sales_price: 0,
            total_cost: 0,
            gross_profit: 0,
            cost_rate: 0
        });
    };

    // Dashboard view
    if (!selectedMenu) {
        return (
            <div className="space-y-8 animate-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">メニュー一覧</h2>
                        <p className="text-muted-foreground mt-1">作成したメニューの原価率を確認・管理できます。</p>
                    </div>
                    <Button onClick={handleAddMenu} size="lg" className="rounded-full shadow-lg">
                        <PlusIcon className="mr-2 h-5 w-5" />
                        新規メニュー作成
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {menus.map(menu => {
                        let rateColorClass = 'text-zinc-700';
                        if (menu.cost_rate > 45) rateColorClass = 'text-zinc-900';
                        else if (menu.cost_rate > 30) rateColorClass = 'text-zinc-800';

                        return (
                            <Card
                                key={menu.id}
                                className="group cursor-pointer transition-all duration-200 bg-card border-border overflow-hidden hover:border-zinc-400/70"
                                onClick={() => setSelectedMenuId(menu.id)}
                            >
                                <div className="aspect-video bg-muted flex items-center justify-center text-muted-foreground">
                                    {menu.image ? (
                                        <img src={menu.image} alt={menu.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <PhotoIcon className="h-10 w-10 opacity-30" />
                                    )}
                                </div>

                                <CardContent className="p-5">
                                    <div className="flex justify-between items-end mb-3">
                                        <h3 className="font-semibold text-lg leading-tight line-clamp-2 text-foreground">
                                            {menu.name || '名称未入力'}
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="rounded-lg bg-muted/60 border border-border p-2">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">販売</p>
                                            <p className="text-sm font-semibold text-foreground tabular-nums">{Math.round(menu.sales_price).toLocaleString()}円</p>
                                        </div>
                                        <div className="rounded-lg bg-muted/60 border border-border p-2">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">原価</p>
                                            <p className="text-sm font-semibold text-foreground tabular-nums">{Math.round(menu.total_cost).toLocaleString()}円</p>
                                        </div>
                                        <div className="rounded-lg bg-muted/60 border border-border p-2">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">原価率</p>
                                            <p className={`text-sm font-semibold tabular-nums ${rateColorClass}`}>{menu.cost_rate.toFixed(1)}%</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {menus.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-card/40 border-2 border-dashed border-border rounded-2xl">
                            <PlusIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground font-medium">メニューがまだありません。<br />最初のメニューを作成しましょう。</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const handleTotalCostChange = (cost: number) => {
        const { totalCost, grossProfit, costRate } = calculateMenuMetrics(selectedMenu.sales_price, cost);
        if (Math.abs(toSafeNumber(selectedMenu.total_cost) - totalCost) > 0.5) {
            updateMenu(selectedMenu.id, {
                total_cost: totalCost,
                gross_profit: grossProfit,
                cost_rate: costRate
            });
        }
    };

    let rateColorClass = 'text-zinc-700';
    if (selectedMenu.cost_rate > 45) rateColorClass = 'text-zinc-900';
    else if (selectedMenu.cost_rate > 30) rateColorClass = 'text-zinc-800';

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in">
            <div className="flex items-center justify-between border-b border-border pb-6">
                <Button
                    variant="ghost"
                    onClick={async () => {
                        const trimmedName = desktopName.trim() || selectedMenu.name.trim();
                        if (!trimmedName) {
                            alert('一覧に戻る前にメニュー名を入力してください。');
                            return;
                        }
                        if (trimmedName !== selectedMenu.name) {
                            await updateMenu(selectedMenu.id, { name: trimmedName });
                        }
                        setSelectedMenuId(null);
                    }}
                    className="pl-0 text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    ダッシュボードへ戻る
                </Button>
                <Button variant="destructive" size="sm" onClick={() => {
                    if (confirm('このメニューを完全に削除しますか？')) {
                        deleteMenu(selectedMenu.id);
                        setSelectedMenuId(null);
                    }
                }} className="opacity-50 hover:opacity-100 transition-opacity">
                    削除
                </Button>
            </div>

            <div className="md:hidden">
                <MenuDetail
                    menu={selectedMenu}
                    onUpdate={updateMenu}
                    calculatedTotalCost={selectedMenu.total_cost}
                />
                <div className="mt-6">
                    <RecipeEditor
                        menuId={selectedMenu.id}
                        onTotalCostChange={handleTotalCostChange}
                    />
                </div>
            </div>

            <div className="hidden md:block space-y-6">
                <Card className="bg-card border-border">
                    <CardContent className="p-5 grid grid-cols-2 gap-4 items-end">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">メニュー名</label>
                            <Input
                                value={desktopName}
                                onChange={(e) => setDesktopName(e.target.value)}
                                onBlur={async () => {
                                    const trimmed = desktopName.trim();
                                    if (trimmed && trimmed !== selectedMenu.name) {
                                        await updateMenu(selectedMenu.id, { name: trimmed });
                                        setDesktopName(trimmed);
                                    }
                                }}
                                placeholder="例: 牛すじ煮込み"
                                className="text-lg font-semibold bg-background border-border"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">販売価格 (円)</label>
                            <Input
                                type="number"
                                value={desktopSalesPrice ?? ''}
                                onChange={(e) => {
                                    const raw = e.target.value;
                                    setDesktopSalesPrice(raw === '' ? null : toSafeNumber(raw));
                                }}
                                onBlur={async () => {
                                    const parsed = desktopSalesPrice ?? 0;
                                    if (parsed !== toSafeNumber(selectedMenu.sales_price)) {
                                        await updateMenu(selectedMenu.id, { sales_price: parsed });
                                    }
                                }}
                                placeholder="例: 850"
                                className="text-lg font-semibold bg-background border-border"
                            />
                        </div>

                        <details className="col-span-2 rounded-lg border border-border bg-muted/40 p-3">
                            <summary className="cursor-pointer text-xs font-bold tracking-wider text-muted-foreground">写真（任意）</summary>
                            <div className="mt-3">
                                {selectedMenu.image ? (
                                    <img src={selectedMenu.image} alt={selectedMenu.name || 'Menu'} className="h-40 w-auto rounded-lg border border-border object-cover" />
                                ) : (
                                    <p className="text-sm text-muted-foreground">写真は未設定です（SP表示で追加できます）。</p>
                                )}
                            </div>
                        </details>
                    </CardContent>
                </Card>

                <RecipeEditor
                    menuId={selectedMenu.id}
                    onTotalCostChange={handleTotalCostChange}
                />

                <div className="sticky bottom-24 z-30 flex justify-end pointer-events-none">
                    <Card className="w-full max-w-lg bg-card border-border shadow-lg pointer-events-auto">
                        <CardContent className="p-4 grid grid-cols-3 gap-3">
                            <div className="rounded-lg bg-muted/50 border border-border p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">原価合計</p>
                                <p className="text-xl font-black tabular-nums text-foreground">{Math.round(selectedMenu.total_cost).toLocaleString()}円</p>
                            </div>
                            <div className="rounded-lg bg-muted/50 border border-border p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">粗利益</p>
                                <p className="text-xl font-black tabular-nums text-foreground">{Math.round(selectedMenu.gross_profit).toLocaleString()}円</p>
                            </div>
                            <div className="rounded-lg bg-muted/50 border border-border p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">原価率</p>
                                <p className={`text-2xl font-black tabular-nums ${rateColorClass}`}>{selectedMenu.cost_rate.toFixed(1)}%</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

        </div>
    );
};

// Icons
const PlusIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="M12 5v14" /></svg>
);

const PhotoIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
);

const ArrowLeftIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
);
