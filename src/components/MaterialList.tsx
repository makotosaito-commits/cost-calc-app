import { useMaterials } from '../hooks/useMaterials';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export const MaterialList = () => {
    const { materials, deleteMaterial } = useMaterials();

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
                <span className="text-xs text-muted-foreground font-medium">{materials.length} 件の材料</span>
            </div>

            <div className="md:hidden divide-y divide-zinc-800/60">
                {materials.map((material) => (
                    <div key={material.id} className="py-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="font-bold text-foreground truncate">{material.name}</p>
                                <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                                    {material.purchase_price.toLocaleString()}円 / {material.purchase_quantity}{material.base_unit}
                                </p>
                                <p className="text-xs text-muted-foreground tabular-nums">
                                    単価 {Math.round(material.calculated_unit_price ?? 0).toLocaleString()}円/{material.base_unit}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    if (confirm(`${material.name} を削除しますか？`)) {
                                        deleteMaterial(material.id);
                                    }
                                }}
                                className="h-7 w-7 shrink-0 text-zinc-500 hover:text-destructive"
                                aria-label={`${material.name} を削除`}
                            >
                                <TrashIcon className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                ))}
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {materials.map((material) => (
                                <TableRow key={material.id} className="border-border hover:bg-muted/50">
                                    <TableCell className="font-bold text-foreground py-4">{material.name}</TableCell>
                                    <TableCell>
                                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                                            {material.category || '未分類'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs">
                                        {material.purchase_price}円 / {material.purchase_quantity}{material.base_unit}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end leading-tight">
                                            <span className="text-lg font-black text-foreground tabular-nums">
                                                {Math.round(material.calculated_unit_price ?? 0).toLocaleString()}円
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
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};

const TrashIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
);
