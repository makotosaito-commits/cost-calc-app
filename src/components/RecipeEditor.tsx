import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRecipes } from '../hooks/useRecipes';
import { calculateLineCost, calculateMaterialUnitPrice, toSafeNumber } from '../lib/calculator';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { Card } from './ui/Card';
import { InputUnit, Material } from '../types';
import { normalizeInternalUnit, normalizePurchaseQuantity, resolveDisplayValues } from '../lib/materialUnits';

interface RecipeEditorProps {
    menuId: string;
    userId: string;
    materials: Material[];
    updateMaterial: (id: string, changes: Partial<Material>) => Promise<void>;
    onNotify?: (message: string) => void;
    onTotalCostChange: (cost: number) => void;
}

type RecipeRow = {
    recipeId: string;
    material: Material | undefined;
    unitPrice: number;
    lineCost: number;
};

type MaterialEditDraft = {
    purchasePrice: string;
    displayQuantity: string;
    displayUnit: InputUnit;
    yieldRate: string;
};

const MATERIAL_INPUT_UNITS: InputUnit[] = ['g', 'kg', 'ml', '個', '枚'];

export const RecipeEditor = ({ menuId, userId, materials, updateMaterial, onNotify, onTotalCostChange }: RecipeEditorProps) => {
    const { recipes, addRecipe, updateRecipe, deleteRecipe } = useRecipes(menuId, userId);
    const [selectedMaterialId, setSelectedMaterialId] = useState('');
    const [usageDrafts, setUsageDrafts] = useState<Record<string, string>>({});
    const [activeUsageId, setActiveUsageId] = useState<string | null>(null);
    const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
    const [materialEditDraft, setMaterialEditDraft] = useState<MaterialEditDraft | null>(null);
    const [isSavingMaterial, setIsSavingMaterial] = useState(false);
    const previousTotalCostRef = useRef<number | null>(null);
    const usageDraftsRef = useRef<Record<string, string>>({});
    const usagePersistTimersRef = useRef<Record<string, number>>({});

    const normalizeBaseUnit = (unit?: string) => {
        if (!unit) return 'g';
        const lower = unit.toLowerCase();
        if (lower === 'kg') return 'g';
        if (lower === 'l') return 'ml';
        return unit;
    };

    const getMaterialUnitPrice = (material?: Material) => {
        if (!material) return 0;
        return calculateMaterialUnitPrice({
            price: material.purchase_price,
            quantity: material.purchase_quantity,
            yieldRate: material.yield_rate,
            fallback: material.calculated_unit_price,
        });
    };

    const normalizeUsageInput = (raw: string) => raw.replace(/[^\d]/g, '');

    const persistUsageDraft = useCallback((recipeId: string, raw: string) => {
        const usageAmount = raw === '' ? 0 : toSafeNumber(raw);
        void updateRecipe(recipeId, { usage_amount: usageAmount }).catch((error) => {
            console.error(error);
        });
    }, [updateRecipe]);

    const queueUsagePersist = useCallback((recipeId: string, raw: string) => {
        const previousTimer = usagePersistTimersRef.current[recipeId];
        if (previousTimer) {
            window.clearTimeout(previousTimer);
        }
        usagePersistTimersRef.current[recipeId] = window.setTimeout(() => {
            delete usagePersistTimersRef.current[recipeId];
            persistUsageDraft(recipeId, raw);
        }, 250);
    }, [persistUsageDraft]);

    const handleUsageChange = (recipeId: string, raw: string) => {
        const normalized = normalizeUsageInput(raw);
        setUsageDrafts((prev) => ({ ...prev, [recipeId]: normalized }));
        queueUsagePersist(recipeId, normalized);
    };

    const handleUsageBlur = (recipeId: string) => {
        setActiveUsageId((prev) => (prev === recipeId ? null : prev));
        const pendingTimer = usagePersistTimersRef.current[recipeId];
        if (!pendingTimer) return;
        window.clearTimeout(pendingTimer);
        delete usagePersistTimersRef.current[recipeId];
        const latestRaw = usageDraftsRef.current[recipeId] ?? '';
        persistUsageDraft(recipeId, latestRaw);
    };

    const handleDeleteRecipe = (recipeId: string) => {
        if (!window.confirm('この材料をレシピから削除しますか？')) {
            return;
        }
        const pendingTimer = usagePersistTimersRef.current[recipeId];
        if (pendingTimer) {
            window.clearTimeout(pendingTimer);
            delete usagePersistTimersRef.current[recipeId];
        }
        void deleteRecipe(recipeId);
    };

    useEffect(() => {
        usageDraftsRef.current = usageDrafts;
    }, [usageDrafts]);

    useEffect(() => () => {
        Object.values(usagePersistTimersRef.current).forEach((timerId) => window.clearTimeout(timerId));
        usagePersistTimersRef.current = {};
    }, []);

    useEffect(() => {
        setUsageDrafts((prev) => {
            const next: Record<string, string> = {};
            recipes.forEach((recipe) => {
                if (activeUsageId === recipe.id && prev[recipe.id] !== undefined) {
                    next[recipe.id] = prev[recipe.id];
                    return;
                }
                next[recipe.id] = String(toSafeNumber(recipe.usage_amount));
            });
            return next;
        });
    }, [recipes, activeUsageId]);

    const materialsById = useMemo(() => (
        new Map(materials.map((material) => [material.id, material]))
    ), [materials]);
    const editingMaterial = useMemo(() => (
        editingMaterialId ? materialsById.get(editingMaterialId) : undefined
    ), [editingMaterialId, materialsById]);

    useEffect(() => {
        recipes.forEach((recipe) => {
            const material = materialsById.get(recipe.material_id);
            if (!material) return;
            const fixedUnit = normalizeBaseUnit(material.base_unit);
            if (recipe.usage_unit !== fixedUnit) {
                void updateRecipe(recipe.id, { usage_unit: fixedUnit });
            }
        });
    }, [materialsById, recipes, updateRecipe]);

    useEffect(() => {
        if (!editingMaterialId) return;
        if (editingMaterial) return;
        setEditingMaterialId(null);
        setMaterialEditDraft(null);
        setIsSavingMaterial(false);
    }, [editingMaterial, editingMaterialId]);

    const recipeRows = useMemo<RecipeRow[]>(() => (
        recipes.map((recipe) => {
            const material = materialsById.get(recipe.material_id);
            const unitPrice = getMaterialUnitPrice(material);
            const usageAmount = toSafeNumber(usageDrafts[recipe.id] ?? String(recipe.usage_amount));
            const lineCost = calculateLineCost(
                usageAmount,
                recipe.usage_unit,
                100,
                unitPrice
            );
            return {
                recipeId: recipe.id,
                material,
                unitPrice,
                lineCost,
            };
        })
    ), [materialsById, recipes, usageDrafts]);

    const totalCost = useMemo(() => (
        recipeRows.reduce((sum, row) => sum + row.lineCost, 0)
    ), [recipeRows]);

    useEffect(() => {
        const previous = previousTotalCostRef.current;
        if (previous !== null && Math.abs(previous - totalCost) < 0.0001) {
            return;
        }
        previousTotalCostRef.current = totalCost;
        onTotalCostChange(totalCost);
    }, [onTotalCostChange, totalCost]);

    const handleAddWithMaterial = async () => {
        if (!selectedMaterialId) return;
        const material = materialsById.get(selectedMaterialId);
        if (!material) return;

        await addRecipe({
            menu_id: menuId,
            material_id: selectedMaterialId,
            usage_amount: 0,
            usage_unit: material.base_unit,
            yield_rate: 100
        });
        setSelectedMaterialId('');
    };

    const openEditModal = (material?: Material) => {
        if (!material) return;
        const resolvedDisplay = resolveDisplayValues(material);
        const initialYieldRate = material.yield_rate === null || material.yield_rate === undefined
            ? ''
            : String(toSafeNumber(material.yield_rate));

        setEditingMaterialId(material.id);
        setMaterialEditDraft({
            purchasePrice: String(toSafeNumber(material.purchase_price)),
            displayQuantity: String(toSafeNumber(resolvedDisplay.displayQuantity)),
            displayUnit: resolvedDisplay.displayUnit,
            yieldRate: initialYieldRate,
        });
    };

    const closeEditModal = () => {
        if (isSavingMaterial) return;
        setEditingMaterialId(null);
        setMaterialEditDraft(null);
    };

    const handleSaveMaterialEdit = async () => {
        if (!editingMaterial || !materialEditDraft || isSavingMaterial) return;

        const purchasePrice = toSafeNumber(materialEditDraft.purchasePrice);
        const displayQuantity = toSafeNumber(materialEditDraft.displayQuantity);
        const yieldRate = toSafeNumber(materialEditDraft.yieldRate);

        if (materialEditDraft.purchasePrice.trim() === '' || purchasePrice < 0) {
            onNotify?.('仕入価格は 0 以上で入力してください。');
            return;
        }
        if (materialEditDraft.displayQuantity.trim() === '' || displayQuantity <= 0) {
            onNotify?.('仕入数量は 0 より大きい値を入力してください。');
            return;
        }
        if (materialEditDraft.yieldRate.trim() === '' || yieldRate <= 0 || yieldRate > 100) {
            onNotify?.('歩留まり（%）は 1〜100 で入力してください。');
            return;
        }

        setIsSavingMaterial(true);

        try {
            const normalizedPurchaseQuantity = normalizePurchaseQuantity(displayQuantity, materialEditDraft.displayUnit);
            const baseUnit = normalizeInternalUnit(materialEditDraft.displayUnit);
            const calculatedUnitPrice = calculateMaterialUnitPrice({
                price: purchasePrice,
                quantity: normalizedPurchaseQuantity,
                yieldRate,
            });

            await updateMaterial(editingMaterial.id, {
                purchase_price: purchasePrice,
                purchase_quantity: normalizedPurchaseQuantity,
                base_unit: baseUnit,
                purchase_display_quantity: displayQuantity,
                purchase_display_unit: materialEditDraft.displayUnit,
                yield_rate: yieldRate,
                calculated_unit_price: calculatedUnitPrice,
            });

            setEditingMaterialId(null);
            setMaterialEditDraft(null);
            onNotify?.(`材料マスタを更新しました（${editingMaterial.name}）`);
        } catch (error) {
            const message = error instanceof Error ? error.message : '材料マスタの更新に失敗しました。';
            onNotify?.(`材料マスタの更新に失敗しました: ${message}`);
        } finally {
            setIsSavingMaterial(false);
        }
    };

    return (
        <>
            <div className="recipe-editor space-y-4 md:space-y-6 rounded-xl border border-border bg-card p-3 md:p-5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">作業エリア</p>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-xl font-bold text-foreground">レシピ構成</h3>
                    <div className="flex gap-2">
                        <select
                            className="flex h-10 w-full md:w-[240px] rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            value={selectedMaterialId}
                            onChange={(e) => setSelectedMaterialId(e.target.value)}
                        >
                            <option value="">材料を追加...</option>
                            {materials.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name}
                                </option>
                            ))}
                        </select>
                        <Button onClick={handleAddWithMaterial} disabled={!selectedMaterialId} size="sm">
                            追加
                        </Button>
                    </div>
                </div>

                <div className="sp-material-list md:hidden">
                    {recipes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">レシピはまだありません。材料を追加してください。</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {recipeRows.map((row) => {
                                const material = row.material;
                                const canEdit = Boolean(material);

                                return (
                                    <div key={row.recipeId} className="py-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                {canEdit ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(material)}
                                                        className="font-bold text-foreground hover:underline underline-offset-4"
                                                    >
                                                        {material?.name}
                                                    </button>
                                                ) : (
                                                    <p className="font-bold text-foreground">Unknown</p>
                                                )}
                                                <p className="text-[10px] text-muted-foreground">
                                                    単価: {Math.round(row.unitPrice).toLocaleString()} 円/{normalizeBaseUnit(material?.base_unit)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditModal(material)}
                                                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                                    disabled={!canEdit}
                                                    aria-label={`${material?.name ?? '材料'}を編集`}
                                                >
                                                    <PencilIcon className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteRecipe(row.recipeId)}
                                                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                                    aria-label={`${material?.name ?? '材料'}をレシピから削除`}
                                                >
                                                    <TrashIcon className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-end justify-between gap-3">
                                            <div className="flex items-end gap-2">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-muted-foreground">使用量</p>
                                                    <Input
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        className="h-9 w-[96px] text-center bg-background border-border focus:border-foreground"
                                                        value={usageDrafts[row.recipeId] ?? ''}
                                                        onFocus={() => setActiveUsageId(row.recipeId)}
                                                        onBlur={() => handleUsageBlur(row.recipeId)}
                                                        onChange={(e) => handleUsageChange(row.recipeId, e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-muted-foreground">単位</p>
                                                    <div className="h-9 min-w-[72px] rounded-xl border border-input bg-muted/40 px-3 flex items-center justify-center text-sm text-foreground">
                                                        {normalizeBaseUnit(material?.base_unit)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-[10px] text-muted-foreground">原価</p>
                                                <p className="text-lg font-black text-foreground tabular-nums">
                                                    {Math.round(row.lineCost).toLocaleString()}円
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="recipe-material-table-wrap hidden md:block">
                    <Card className="bg-card border-border p-0">
                        <div className="overflow-x-auto">
                            <Table className="recipe-material-table">
                                <TableHeader className="bg-muted/40">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead>使用材料</TableHead>
                                        <TableHead className="w-[120px] text-center">使用量</TableHead>
                                        <TableHead className="w-[100px] text-center">単位</TableHead>
                                        <TableHead className="text-right">原価(円)</TableHead>
                                        <TableHead className="w-[90px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recipeRows.map((row) => {
                                        const material = row.material;
                                        const canEdit = Boolean(material);

                                        return (
                                            <TableRow key={row.recipeId} className="group">
                                                <TableCell className="font-bold py-4">
                                                    {canEdit ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(material)}
                                                            className="text-left font-bold text-foreground hover:underline underline-offset-4"
                                                        >
                                                            {material?.name}
                                                        </button>
                                                    ) : (
                                                        'Unknown'
                                                    )}
                                                    <p className="text-[10px] text-muted-foreground font-normal">
                                                        単価: {Math.round(row.unitPrice).toLocaleString()} 円/{normalizeBaseUnit(material?.base_unit)}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        className="h-9 w-[100px] mx-auto text-center bg-background border-border focus:border-foreground"
                                                        value={usageDrafts[row.recipeId] ?? ''}
                                                        onFocus={() => setActiveUsageId(row.recipeId)}
                                                        onBlur={() => handleUsageBlur(row.recipeId)}
                                                        onChange={(e) => handleUsageChange(row.recipeId, e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center font-medium text-foreground">
                                                    {normalizeBaseUnit(material?.base_unit)}
                                                </TableCell>
                                                <TableCell className="text-right font-black text-foreground">
                                                    {Math.round(row.lineCost).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openEditModal(material)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                                            disabled={!canEdit}
                                                            aria-label={`${material?.name ?? '材料'}を編集`}
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteRecipe(row.recipeId)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                                            aria-label={`${material?.name ?? '材料'}をレシピから削除`}
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        {recipes.length === 0 && (
                            <div className="py-12 text-center text-muted-foreground text-sm">
                                レシピが空です。上のプルダウンから材料を追加してください。
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {editingMaterial && materialEditDraft && (
                <div className="fixed inset-0 z-[90] bg-black/45 backdrop-blur-[1px] flex items-center justify-center px-4">
                    <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-5">
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-foreground">材料を編集</h3>
                            <p className="text-sm text-muted-foreground">
                                この変更は材料マスタに保存され、他のメニューにも反映されます。
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">材料名</p>
                                <div className="h-11 rounded-xl border border-input bg-muted/40 px-3 flex items-center text-foreground font-semibold">
                                    {editingMaterial.name}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">仕入価格 (円)</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={materialEditDraft.purchasePrice}
                                        onChange={(e) => setMaterialEditDraft((prev) => (prev ? { ...prev, purchasePrice: e.target.value } : prev))}
                                        className="bg-background border-border h-11"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">仕入数量</label>
                                    <Input
                                        type="number"
                                        min="0.0001"
                                        step="any"
                                        value={materialEditDraft.displayQuantity}
                                        onChange={(e) => setMaterialEditDraft((prev) => (prev ? { ...prev, displayQuantity: e.target.value } : prev))}
                                        className="bg-background border-border h-11"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">単位</label>
                                <select
                                    value={materialEditDraft.displayUnit}
                                    onChange={(e) => {
                                        const unit = e.target.value as InputUnit;
                                        setMaterialEditDraft((prev) => (prev ? { ...prev, displayUnit: unit } : prev));
                                    }}
                                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    {MATERIAL_INPUT_UNITS.map((unit) => (
                                        <option key={unit} value={unit}>{unit}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">歩留まり(%)</label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="100"
                                    step="any"
                                    value={materialEditDraft.yieldRate}
                                    onChange={(e) => setMaterialEditDraft((prev) => (prev ? { ...prev, yieldRate: e.target.value } : prev))}
                                    className="bg-background border-border h-11"
                                    placeholder="1〜100"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <Button
                                variant="outline"
                                onClick={closeEditModal}
                                disabled={isSavingMaterial}
                            >
                                キャンセル
                            </Button>
                            <Button
                                onClick={() => {
                                    void handleSaveMaterialEdit();
                                }}
                                disabled={isSavingMaterial}
                            >
                                {isSavingMaterial ? '保存中...' : '保存する'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const TrashIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
);

const PencilIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
);
