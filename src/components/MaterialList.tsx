import { useMemo, useState } from 'react';
import { useMaterials } from '../hooks/useMaterials';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { calculateUnitPriceWithYield, normalizeAmount, toSafeNumber } from '../lib/calculator';
import { Material } from '../types';
import { resolveDisplayValues } from '../lib/materialUnits';

type MaterialListProps = {
    onEdit: (material: Material) => void;
};

const ALL_CATEGORY = '__all__';
const UNCATEGORIZED_CATEGORY = '__uncategorized__';

export const MaterialList = ({ onEdit }: MaterialListProps) => {
    const { materials, deleteMaterial } = useMaterials();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);

    const getUnitPrice = (price: number, quantity: number, unit: string, yieldRate?: number | null, fallback?: number) => {
        const normalizedQty = normalizeAmount(toSafeNumber(quantity), unit);
        if (normalizedQty > 0) return calculateUnitPriceWithYield(toSafeNumber(price), normalizedQty, yieldRate);
        return toSafeNumber(fallback);
    };

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    const categoryOptions = useMemo(() => {
        const categories = new Set<string>();
        let hasUncategorized = false;

        for (const material of materials) {
            const category = material.category.trim();
            if (category) {
                categories.add(category);
                continue;
            }
            hasUncategorized = true;
        }

        const sortedCategories = [...categories].sort((a, b) => a.localeCompare(b, 'ja'));
        if (hasUncategorized) {
            sortedCategories.push(UNCATEGORIZED_CATEGORY);
        }
        return sortedCategories;
    }, [materials]);

    const filteredMaterials = useMemo(() => {
        return materials.filter((material) => {
            const materialName = material.name.toLowerCase();
            const materialCategory = material.category.trim();

            const matchesName = normalizedSearchTerm === '' || materialName.includes(normalizedSearchTerm);
            const matchesCategory =
                selectedCategory === ALL_CATEGORY ||
                (selectedCategory === UNCATEGORIZED_CATEGORY
                    ? materialCategory === ''
                    : materialCategory === selectedCategory);

            return matchesName && matchesCategory;
        });
    }, [materials, normalizedSearchTerm, selectedCategory]);

    const hasActiveFilters = normalizedSearchTerm !== '' || selectedCategory !== ALL_CATEGORY;

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategory(ALL_CATEGORY);
    };

    if (!materials || materials.length === 0) {
        return (
            <div className="py-6 text-sm text-muted-foreground">
                登録済みの材料はありません。
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6 animate-in xl:flex xl:flex-col xl:min-h-0 xl:h-full">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground">登録済み材料</h3>
                <span className="text-xs text-muted-foreground font-medium">{materials.length}件中 {filteredMaterials.length}件を表示</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                <div className="relative flex-1">
                    <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="材料名で検索"
                        className="h-11 border-border bg-background pl-10"
                    />
                </div>

                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring md:w-52"
                >
                    <option value={ALL_CATEGORY}>すべて</option>
                    {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                            {category === UNCATEGORIZED_CATEGORY ? '未分類' : category}
                        </option>
                    ))}
                </select>

                <Button
                    type="button"
                    variant="outline"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className="h-11 px-4 text-sm md:px-3"
                    aria-label="検索条件をクリア"
                >
                    <XIcon className="h-4 w-4" />
                </Button>
            </div>

            {filteredMaterials.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card/40 py-6 text-center text-sm text-muted-foreground">
                    該当する材料がありません
                </div>
            ) : (
                <>
                    <div className="md:hidden divide-y divide-border">
                        {filteredMaterials.map((material) => {
                            const purchaseDisplay = resolveDisplayValues(material);
                            return (
                                <div key={material.id} className="py-3 px-1 rounded-lg bg-card border border-border">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 pr-2">
                                            <p className="font-bold text-foreground leading-tight break-words">{material.name}</p>
                                            <p className="mt-1 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                                                {toSafeNumber(material.purchase_price).toLocaleString()}円 / {purchaseDisplay.quantity.toLocaleString()}{purchaseDisplay.unit}
                                            </p>
                                            <p className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                                                単価 {Math.round(getUnitPrice(material.purchase_price, material.purchase_quantity, material.base_unit, material.yield_rate, material.calculated_unit_price)).toLocaleString()}円/{material.base_unit}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(material)}
                                            className="h-6 w-6 shrink-0 self-center text-muted-foreground hover:text-foreground"
                                            aria-label={`${material.name} を編集`}
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                if (confirm(`${material.name} を削除しますか？`)) {
                                                    deleteMaterial(material.id);
                                                }
                                            }}
                                            className="h-6 w-6 shrink-0 self-center text-muted-foreground hover:text-foreground"
                                            aria-label={`${material.name} を削除`}
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <Card className="hidden md:block bg-card/50 border-border p-0 xl:flex-1 xl:min-h-0">
                        <div className="overflow-x-auto xl:h-full xl:overflow-y-auto">
                            <Table>
                                <TableHeader className="bg-background border-none xl:sticky xl:top-0 xl:z-10 xl:backdrop-blur-sm">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="py-4">名前</TableHead>
                                        <TableHead>カテゴリ</TableHead>
                                        <TableHead className="text-right">仕入詳細</TableHead>
                                        <TableHead className="text-right">基準単価</TableHead>
                                        <TableHead className="w-[60px]"></TableHead>
                                        <TableHead className="w-[60px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredMaterials.map((material) => {
                                        const purchaseDisplay = resolveDisplayValues(material);
                                        return (
                                            <TableRow key={material.id} className="border-border hover:bg-muted/50">
                                                <TableCell className="font-bold text-foreground py-4">{material.name}</TableCell>
                                                <TableCell>
                                                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                                                        {material.category || '未分類'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-xs">
                                                    {toSafeNumber(material.purchase_price)}円 / {purchaseDisplay.quantity.toLocaleString()}{purchaseDisplay.unit}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex flex-col items-end leading-tight">
                                                        <span className="text-lg font-black text-foreground tabular-nums">
                                                            {Math.round(getUnitPrice(material.purchase_price, material.purchase_quantity, material.base_unit, material.yield_rate, material.calculated_unit_price)).toLocaleString()}円
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-bold tracking-wide">
                                                            /{material.base_unit}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onEdit(material)}
                                                        className="text-muted-foreground hover:text-foreground"
                                                        aria-label={`${material.name} を編集`}
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            if (confirm(`${material.name} を削除しますか？`)) {
                                                                deleteMaterial(material.id);
                                                            }
                                                        }}
                                                        className="text-muted-foreground hover:text-destructive"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
};

const TrashIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
);

const PencilIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
);

const XIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);
