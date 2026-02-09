import { useState, useEffect } from 'react';
import { useRecipes } from '../hooks/useRecipes';
import { useMaterials } from '../hooks/useMaterials';
import { calculateLineCost, toSafeNumber } from '../lib/calculator';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { Card } from './ui/Card';

interface RecipeEditorProps {
    menuId: string;
    onTotalCostChange: (cost: number) => void;
}

export const RecipeEditor = ({ menuId, onTotalCostChange }: RecipeEditorProps) => {
    const { recipes, addRecipe, updateRecipe, deleteRecipe } = useRecipes(menuId);
    const { materials } = useMaterials();
    const [selectedMaterialId, setSelectedMaterialId] = useState('');

    useEffect(() => {
        recipes.forEach((recipe) => {
            if (recipe.usage_unit === 'kg') {
                updateRecipe(recipe.id, { usage_amount: recipe.usage_amount * 1000, usage_unit: 'g' });
            }
            if (recipe.usage_unit === 'L') {
                updateRecipe(recipe.id, { usage_amount: recipe.usage_amount * 1000, usage_unit: 'ml' });
            }
        });
    }, [recipes, updateRecipe]);

    useEffect(() => {
        let total = 0;
        recipes.forEach(recipe => {
            const material = materials.find(m => m.id === recipe.material_id);
            const cost = calculateLineCost(
                toSafeNumber(recipe.usage_amount),
                recipe.usage_unit,
                100,
                toSafeNumber(material?.calculated_unit_price)
            );
            total += cost;
        });
        onTotalCostChange(total);
    }, [recipes, materials, onTotalCostChange]);

    const handleAddWithMaterial = async () => {
        if (!selectedMaterialId) return;
        const material = materials.find(m => m.id === selectedMaterialId);
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

    return (
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

            <div className="sp-material-list">
                {recipes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">レシピはまだありません。材料を追加してください。</p>
                ) : (
                    <div className="divide-y divide-border">
                        {recipes.map((recipe) => {
                            const material = materials.find(m => m.id === recipe.material_id);
                            const lineCost = calculateLineCost(
                                toSafeNumber(recipe.usage_amount),
                                recipe.usage_unit,
                                100,
                                toSafeNumber(material?.calculated_unit_price)
                            );

                            return (
                                <div key={recipe.id} className="py-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-bold text-foreground">{material?.name || 'Unknown'}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                単価: {material?.calculated_unit_price?.toFixed(3)} 円/{material?.base_unit}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteRecipe(recipe.id)}
                                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                        >
                                            <TrashIcon className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>

                                    <div className="mt-3 flex items-end justify-between gap-3">
                                        <div className="flex items-end gap-2">
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-muted-foreground">使用量</p>
                                                <Input
                                                    type="number"
                                                    className="h-9 w-[96px] text-center bg-background border-border focus:border-foreground"
                                                    value={recipe.usage_amount}
                                                    onChange={(e) => updateRecipe(recipe.id, { usage_amount: toSafeNumber(e.target.value) })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-muted-foreground">単位</p>
                                                <select
                                                    className="h-9 w-[72px] rounded-xl border border-input bg-background text-sm text-center focus:ring-2 focus:ring-ring outline-none"
                                                    value={recipe.usage_unit}
                                                    onChange={(e) => updateRecipe(recipe.id, { usage_unit: e.target.value })}
                                                >
                                                    <option value="g">g</option>
                                                    <option value="ml">ml</option>
                                                    <option value="個">個</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-[10px] text-muted-foreground">原価</p>
                                            <p className="text-lg font-black text-foreground tabular-nums">
                                                {Math.round(lineCost).toLocaleString()}円
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
                                    <TableHead className="w-[60px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recipes.map((recipe) => {
                                    const material = materials.find(m => m.id === recipe.material_id);
                                    const lineCost = calculateLineCost(
                                        toSafeNumber(recipe.usage_amount),
                                        recipe.usage_unit,
                                        100,
                                        toSafeNumber(material?.calculated_unit_price)
                                    );

                                    return (
                                        <TableRow key={recipe.id} className="group">
                                            <TableCell className="font-bold py-4">
                                                {material?.name || 'Unknown'}
                                                <p className="text-[10px] text-muted-foreground font-normal">
                                                    単価: {material?.calculated_unit_price?.toFixed(3)} 円/{material?.base_unit}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    className="h-9 w-[100px] mx-auto text-center bg-background border-border focus:border-foreground"
                                                    value={recipe.usage_amount}
                                                    onChange={(e) => updateRecipe(recipe.id, { usage_amount: toSafeNumber(e.target.value) })}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <select
                                                    className="h-9 w-full rounded-xl border border-input bg-background text-sm text-center focus:ring-2 focus:ring-ring outline-none"
                                                    value={recipe.usage_unit}
                                                    onChange={(e) => updateRecipe(recipe.id, { usage_unit: e.target.value })}
                                                >
                                                    <option value="g">g</option>
                                                    <option value="ml">ml</option>
                                                    <option value="個">個</option>
                                                </select>
                                            </TableCell>
                                            <TableCell className="text-right font-black text-foreground">
                                                {Math.round(lineCost).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => deleteRecipe(recipe.id)} className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <TrashIcon className="h-4 w-4" />
                                                </Button>
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
    );
};

const TrashIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
);
