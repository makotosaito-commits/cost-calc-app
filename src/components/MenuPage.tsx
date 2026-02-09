import { useState } from 'react';
import { useMenus } from '../hooks/useMenus';
import { useCostRateSettings } from '../contexts/CostRateSettingsContext';
import { MenuDetail } from './MenuDetail';
import { RecipeEditor } from './RecipeEditor';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { calculateMenuMetrics, toSafeNumber } from '../lib/calculator';
import { evaluateCostRate } from '../lib/costRateSettings';

export const MenuPage = () => {
    const { menus, addMenu, updateMenu, deleteMenu } = useMenus();
    const { settings } = useCostRateSettings();
    const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
    const selectedMenu = selectedMenuId ? menus.find(m => m.id === selectedMenuId) : null;

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
                        const safeSales = Number.isFinite(toSafeNumber(menu.sales_price)) && toSafeNumber(menu.sales_price) > 0
                            ? Math.round(toSafeNumber(menu.sales_price)).toLocaleString()
                            : '—';
                        const safeCost = Number.isFinite(toSafeNumber(menu.total_cost))
                            ? Math.round(toSafeNumber(menu.total_cost)).toLocaleString()
                            : '—';
                        const evaluated = evaluateCostRate(menu.cost_rate, menu.sales_price, settings);
                        const rateColorClass = evaluated.tone === 'none'
                            ? 'text-muted-foreground'
                            : evaluated.tone === 'good'
                                ? 'text-zinc-700'
                                : evaluated.tone === 'warn'
                                    ? 'text-zinc-800'
                                    : 'text-zinc-900';

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
                                            <p className="text-sm font-semibold text-foreground tabular-nums">{safeSales}{safeSales === '—' ? '' : '円'}</p>
                                        </div>
                                        <div className="rounded-lg bg-muted/60 border border-border p-2">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">原価</p>
                                            <p className="text-sm font-semibold text-foreground tabular-nums">{safeCost}{safeCost === '—' ? '' : '円'}</p>
                                        </div>
                                        <div className="rounded-lg bg-muted/60 border border-border p-2">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">原価率</p>
                                            <p className={`text-sm font-semibold tabular-nums ${rateColorClass}`}>{evaluated.displayRate ?? '—'}{evaluated.displayRate === null ? '' : '%'}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">{evaluated.label ?? '—'}</p>
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

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in">
            <div className="flex items-center justify-between border-b border-border pb-6">
                <Button
                    variant="ghost"
                    onClick={async () => {
                        const trimmedName = selectedMenu.name.trim();
                        if (!trimmedName) {
                            alert('一覧に戻る前にメニュー名を入力してください。');
                            return;
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

            <div className="grid grid-cols-1 md:grid-cols-[360px_minmax(0,1fr)] gap-6 items-start">
                <div className="md:sticky md:top-6 md:max-h-[calc(100dvh-8rem)] md:overflow-auto">
                    <MenuDetail
                        menu={selectedMenu}
                        onUpdate={updateMenu}
                        calculatedTotalCost={selectedMenu.total_cost}
                    />
                </div>
                <div className="space-y-6">
                    <RecipeEditor
                        menuId={selectedMenu.id}
                        onTotalCostChange={handleTotalCostChange}
                    />
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
