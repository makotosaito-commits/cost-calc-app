import { useState } from 'react';
import { useMenus } from '../hooks/useMenus';
import { MenuDetail } from './MenuDetail';
import { RecipeEditor } from './RecipeEditor';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';

export const MenuPage = () => {
    const { menus, addMenu, updateMenu, deleteMenu } = useMenus();
    const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);

    // Dashboard view
    if (!selectedMenuId) {
        const handleAddMenu = async () => {
            await addMenu({
                name: '新規メニュー',
                sales_price: 0,
                total_cost: 0,
                gross_profit: 0,
                cost_rate: 0
            });
        };

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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menus.map(menu => {
                        let badgeVariant: 'success' | 'warning' | 'destructive' = 'success';
                        if (menu.cost_rate > 45) badgeVariant = 'destructive';
                        else if (menu.cost_rate > 30) badgeVariant = 'warning';

                        return (
                            <Card
                                key={menu.id}
                                className="group relative cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all duration-300 bg-card border-border overflow-hidden"
                                onClick={() => setSelectedMenuId(menu.id)}
                            >
                                <div className="aspect-video bg-muted flex items-center justify-center text-muted-foreground transition-colors group-hover:bg-accent relative">
                                    {menu.image ? (
                                        <img src={menu.image} alt={menu.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    ) : (
                                        <PhotoIcon className="h-12 w-12 opacity-20" />
                                    )}
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60" />
                                </div>

                                <CardContent className="p-5 absolute bottom-0 left-0 right-0">
                                    <div className="flex justify-between items-end mb-1">
                                        <h3 className="font-bold text-xl leading-tight line-clamp-2 text-white group-hover:text-primary-foreground transition-colors drop-shadow-md">{menu.name}</h3>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {menu.sales_price.toLocaleString()} 円
                                        </p>
                                        <Badge variant={badgeVariant} className="shrink-0 shadow-sm backdrop-blur-sm">
                                            {menu.cost_rate.toFixed(1)}%
                                        </Badge>
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

    // Edit Mode
    const selectedMenu = menus.find(m => m.id === selectedMenuId);
    if (!selectedMenu) {
        setSelectedMenuId(null);
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in">
            <div className="flex items-center justify-between border-b border-border pb-6">
                <Button variant="ghost" onClick={() => setSelectedMenuId(null)} className="pl-0 text-muted-foreground hover:text-foreground">
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

            <div className="space-y-12">
                <MenuDetail
                    menu={selectedMenu}
                    onUpdate={updateMenu}
                    calculatedTotalCost={selectedMenu.total_cost}
                />

                <RecipeEditor
                    menuId={selectedMenu.id}
                    onTotalCostChange={(cost) => {
                        if (Math.abs(selectedMenu.total_cost - cost) > 1) {
                            const profit = selectedMenu.sales_price - cost;
                            const rate = selectedMenu.sales_price > 0 ? (cost / selectedMenu.sales_price) * 100 : 0;
                            updateMenu(selectedMenu.id, {
                                total_cost: cost,
                                gross_profit: profit,
                                cost_rate: rate
                            });
                        }
                    }}
                />
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
