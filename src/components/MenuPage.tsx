import { useCallback, useEffect, useRef, useState } from 'react';
import { useBeforeUnload } from 'react-router-dom';
import { useCostRateSettings } from '../contexts/CostRateSettingsContext';
import { useUnsavedChanges } from '../contexts/UnsavedChangesContext';
import { MenuDetail } from './MenuDetail';
import { RecipeEditor } from './RecipeEditor';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { calculateMenuMetrics, toSafeNumber } from '../lib/calculator';
import { evaluateCostRate } from '../lib/costRateSettings';
import { Material, Menu } from '../types';

type MenuPageProps = {
    menus: Menu[];
    userId: string;
    addMenu: (menu: Omit<Menu, 'id' | 'user_id'>) => Promise<void>;
    updateMenu: (id: string, changes: Partial<Menu>) => Promise<void>;
    updateMaterial: (id: string, changes: Partial<Material>) => Promise<void>;
    deleteMenu: (id: string) => Promise<void>;
    materials: Material[];
};

export const MenuPage = ({ menus, userId, addMenu, updateMenu, updateMaterial, deleteMenu, materials }: MenuPageProps) => {
    const { settings } = useCostRateSettings();
    const { hasUnsavedMenuChanges, setHasUnsavedMenuChanges } = useUnsavedChanges();
    const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
    const [liveTotalCost, setLiveTotalCost] = useState<number | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const selectedMenu = selectedMenuId ? menus.find(m => m.id === selectedMenuId) : null;
    const toastTimerRef = useRef<number | null>(null);
    const menuCostPersistTimerRef = useRef<number | null>(null);
    const lastPersistedTotalCostRef = useRef<Record<string, number>>({});

    const showToast = useCallback((message: string) => {
        setToastMessage(message);
        if (toastTimerRef.current) {
            window.clearTimeout(toastTimerRef.current);
        }
        toastTimerRef.current = window.setTimeout(() => {
            setToastMessage(null);
            toastTimerRef.current = null;
        }, 3000);
    }, []);

    useEffect(() => () => {
        if (toastTimerRef.current) {
            window.clearTimeout(toastTimerRef.current);
        }
        if (menuCostPersistTimerRef.current) {
            window.clearTimeout(menuCostPersistTimerRef.current);
        }
    }, []);

    useEffect(() => {
        if (menuCostPersistTimerRef.current) {
            window.clearTimeout(menuCostPersistTimerRef.current);
            menuCostPersistTimerRef.current = null;
        }
        if (!selectedMenu) {
            setLiveTotalCost(null);
            return;
        }
        const initialTotalCost = toSafeNumber(selectedMenu.total_cost);
        setLiveTotalCost(initialTotalCost);
        lastPersistedTotalCostRef.current[selectedMenu.id] = initialTotalCost;
    }, [selectedMenuId]);

    useEffect(() => {
        if (!selectedMenuId) {
            setHasUnsavedMenuChanges(false);
        }
    }, [selectedMenuId, setHasUnsavedMenuChanges]);

    const confirmDiscardChanges = useCallback(() => (
        !hasUnsavedMenuChanges || window.confirm('編集中の内容があります。保存せず移動しますか？')
    ), [hasUnsavedMenuChanges]);

    useEffect(() => () => {
        setHasUnsavedMenuChanges(false);
    }, [setHasUnsavedMenuChanges]);

    useBeforeUnload((event) => {
        if (!hasUnsavedMenuChanges) return;
        event.preventDefault();
        event.returnValue = '';
    });

    const handleAddMenu = async () => {
        try {
            await addMenu({
                name: '',
                sales_price: 0,
                total_cost: 0,
                gross_profit: 0,
                cost_rate: 0
            });
            showToast('メニューを登録しました');
        } catch (error) {
            console.error(error);
        }
    };

    const toastNode = toastMessage ? (
        <div
            aria-live="polite"
            className="fixed left-1/2 -translate-x-1/2 bottom-[max(84px,calc(env(safe-area-inset-bottom)+84px))] z-[70] w-[min(92vw,360px)] rounded-xl border border-zinc-300 bg-zinc-900/95 px-4 py-3 text-sm font-medium text-zinc-50 shadow-xl backdrop-blur-sm"
        >
            {toastMessage}
        </div>
    ) : null;

    const handleTotalCostChange = useCallback((cost: number) => {
        if (!selectedMenu) return;
        const normalizedCost = toSafeNumber(cost);
        setLiveTotalCost(normalizedCost);

        if (menuCostPersistTimerRef.current) {
            window.clearTimeout(menuCostPersistTimerRef.current);
        }

        const menuId = selectedMenu.id;
        const salesPrice = selectedMenu.sales_price;
        menuCostPersistTimerRef.current = window.setTimeout(() => {
            menuCostPersistTimerRef.current = null;
            const { totalCost, grossProfit, costRate } = calculateMenuMetrics(salesPrice, normalizedCost);
            const lastPersisted = lastPersistedTotalCostRef.current[menuId];
            if (lastPersisted !== undefined && Math.abs(lastPersisted - totalCost) <= 0.5) {
                return;
            }
            lastPersistedTotalCostRef.current[menuId] = totalCost;
            void updateMenu(menuId, {
                total_cost: totalCost,
                gross_profit: grossProfit,
                cost_rate: costRate
            }).catch((error) => {
                console.error(error);
                delete lastPersistedTotalCostRef.current[menuId];
            });
        }, 250);
    }, [selectedMenu, updateMenu]);

    const handleManualUpdate = useCallback(async (id: string, changes: Parameters<typeof updateMenu>[1]) => {
        await updateMenu(id, changes);
    }, [updateMenu]);

    // Dashboard view
    if (!selectedMenu) {
        return (
            <>
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
                {toastNode}
            </>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in md:flex md:h-[calc(100dvh-9.5rem)] md:flex-col md:space-y-0 md:overflow-hidden">
            <div className="flex items-center justify-between border-b border-border pb-4 md:pb-3 md:mb-3 md:shrink-0">
                <Button
                    variant="ghost"
                    onClick={() => {
                        if (!confirmDiscardChanges()) return;
                        setSelectedMenuId(null);
                    }}
                    className="pl-0 text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    ダッシュボードへ戻る
                </Button>
                <Button variant="destructive" size="sm" onClick={async () => {
                    if (confirm('このメニューを削除しますか？\nこの操作は元に戻せません。')) {
                        try {
                            await deleteMenu(selectedMenu.id);
                            setSelectedMenuId(null);
                        } catch (error) {
                            console.error(error);
                        }
                    }
                }} className="opacity-50 hover:opacity-100 transition-opacity">
                    削除
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[332px_minmax(0,1fr)] gap-6 md:gap-4 items-start md:flex-1 md:min-h-0 md:overflow-hidden">
                <div className="md:sticky md:top-0 md:h-full md:max-h-full md:overflow-hidden">
                    <MenuDetail
                        menu={selectedMenu}
                        onUpdate={handleManualUpdate}
                        calculatedTotalCost={liveTotalCost ?? toSafeNumber(selectedMenu.total_cost)}
                        onDirtyChange={setHasUnsavedMenuChanges}
                        onManualUpdateSuccess={() => showToast('メニューを更新しました')}
                    />
                </div>
                <div className="space-y-6 md:h-full md:min-h-0 md:overflow-y-auto md:pr-1 md:pb-1">
                    <RecipeEditor
                        menuId={selectedMenu.id}
                        userId={userId}
                        materials={materials}
                        updateMaterial={updateMaterial}
                        onNotify={showToast}
                        onTotalCostChange={handleTotalCostChange}
                    />
                </div>
            </div>
            {toastNode}
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
