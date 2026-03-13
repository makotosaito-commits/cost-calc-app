import { db } from '../lib/db';
import { useEffect, useState } from 'react';
import { useCostRateSettings } from '../contexts/CostRateSettingsContext';
import { DEFAULT_COST_RATE_SETTINGS } from '../lib/costRateSettings';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Input } from './ui/Input';

type SettingsPageProps = {
    currentUserEmail?: string | null;
};

type BasicMaterialSeed = {
    name: string;
    category: string;
    unit: 'g' | 'ml' | '個';
    yield_rate: number;
};

const BASIC_MATERIAL_SEEDS: BasicMaterialSeed[] = [
    { name: '玉ねぎ', category: '野菜', unit: 'g', yield_rate: 90 },
    { name: 'にんじん', category: '野菜', unit: 'g', yield_rate: 88 },
    { name: 'キャベツ', category: '野菜', unit: 'g', yield_rate: 85 },
    { name: 'レタス', category: '野菜', unit: 'g', yield_rate: 90 },
    { name: 'トマト', category: '野菜', unit: 'g', yield_rate: 95 },
    { name: 'きゅうり', category: '野菜', unit: 'g', yield_rate: 95 },
    { name: 'じゃがいも', category: '野菜', unit: 'g', yield_rate: 80 },
    { name: '長ねぎ', category: '野菜', unit: 'g', yield_rate: 85 },
    { name: 'にんにく', category: '野菜', unit: 'g', yield_rate: 80 },
    { name: 'しょうが', category: '野菜', unit: 'g', yield_rate: 90 },
    { name: 'ピーマン', category: '野菜', unit: 'g', yield_rate: 90 },
    { name: 'なす', category: '野菜', unit: 'g', yield_rate: 90 },
    { name: '鶏もも肉', category: '肉', unit: 'g', yield_rate: 85 },
    { name: '鶏むね肉', category: '肉', unit: 'g', yield_rate: 90 },
    { name: '鶏ひき肉', category: '肉', unit: 'g', yield_rate: 100 },
    { name: '豚肉', category: '肉', unit: 'g', yield_rate: 90 },
    { name: '豚ひき肉', category: '肉', unit: 'g', yield_rate: 100 },
    { name: '牛肉', category: '肉', unit: 'g', yield_rate: 90 },
    { name: '牛ひき肉', category: '肉', unit: 'g', yield_rate: 100 },
    { name: 'ベーコン', category: '肉', unit: 'g', yield_rate: 100 },
    { name: '鮭', category: '魚', unit: 'g', yield_rate: 85 },
    { name: 'まぐろ', category: '魚', unit: 'g', yield_rate: 95 },
    { name: 'えび', category: '魚', unit: 'g', yield_rate: 50 },
    { name: 'いか', category: '魚', unit: 'g', yield_rate: 85 },
    { name: 'たこ', category: '魚', unit: 'g', yield_rate: 100 },
    { name: 'ツナ', category: '魚', unit: 'g', yield_rate: 100 },
    { name: 'しらす', category: '魚', unit: 'g', yield_rate: 100 },
    { name: '卵', category: '卵・乳製品', unit: '個', yield_rate: 100 },
    { name: '牛乳', category: '卵・乳製品', unit: 'ml', yield_rate: 100 },
    { name: '生クリーム', category: '卵・乳製品', unit: 'ml', yield_rate: 100 },
    { name: 'バター', category: '卵・乳製品', unit: 'g', yield_rate: 100 },
    { name: 'チーズ', category: '卵・乳製品', unit: 'g', yield_rate: 100 },
    { name: '米', category: '主食', unit: 'g', yield_rate: 100 },
    { name: '食パン', category: '主食', unit: '個', yield_rate: 100 },
    { name: 'パスタ', category: '主食', unit: 'g', yield_rate: 100 },
    { name: '小麦粉', category: '粉類', unit: 'g', yield_rate: 100 },
    { name: 'パン粉', category: '粉類', unit: 'g', yield_rate: 100 },
    { name: '片栗粉', category: '粉類', unit: 'g', yield_rate: 100 },
    { name: '塩', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: '砂糖', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: '醤油', category: '調味料', unit: 'ml', yield_rate: 100 },
    { name: '味噌', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: '酢', category: '調味料', unit: 'ml', yield_rate: 100 },
    { name: 'みりん', category: '調味料', unit: 'ml', yield_rate: 100 },
    { name: '料理酒', category: '調味料', unit: 'ml', yield_rate: 100 },
    { name: 'サラダ油', category: '調味料', unit: 'ml', yield_rate: 100 },
    { name: 'ごま油', category: '調味料', unit: 'ml', yield_rate: 100 },
    { name: 'マヨネーズ', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: 'ケチャップ', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: 'ウスターソース', category: '調味料', unit: 'ml', yield_rate: 100 },
];

export const SettingsPage = ({ currentUserEmail }: SettingsPageProps) => {
    const { settings, updateSettings, resetSettings } = useCostRateSettings();
    const [targetDraft, setTargetDraft] = useState(String(settings.targetCostRate));
    const [warnDraft, setWarnDraft] = useState(String(settings.warnCostRate));
    const [dangerDraft, setDangerDraft] = useState(String(settings.dangerCostRate));
    const [isSeedConfirmOpen, setIsSeedConfirmOpen] = useState(false);
    const [isSeedingMaterials, setIsSeedingMaterials] = useState(false);

    useEffect(() => {
        setTargetDraft(String(settings.targetCostRate));
        setWarnDraft(String(settings.warnCostRate));
        setDangerDraft(String(settings.dangerCostRate));
    }, [settings.targetCostRate, settings.warnCostRate, settings.dangerCostRate]);

    const clampPercent = (value: number) => {
        if (!Number.isFinite(value)) return 0;
        if (value < 0) return 0;
        if (value > 100) return 100;
        return value;
    };

    const parsePercent = (raw: string, fallback: number) => {
        const numeric = Number.parseFloat(raw);
        if (!Number.isFinite(numeric)) return fallback;
        return clampPercent(numeric);
    };

    const handleBlurTarget = () => {
        const next = parsePercent(targetDraft, DEFAULT_COST_RATE_SETTINGS.targetCostRate);
        updateSettings({ targetCostRate: next });
        setTargetDraft(String(next));
    };

    const handleBlurWarn = () => {
        const next = parsePercent(warnDraft, DEFAULT_COST_RATE_SETTINGS.warnCostRate);
        updateSettings({ warnCostRate: next });
        setWarnDraft(String(next));
    };

    const handleBlurDanger = () => {
        const next = parsePercent(dangerDraft, DEFAULT_COST_RATE_SETTINGS.dangerCostRate);
        updateSettings({ dangerCostRate: next });
        setDangerDraft(String(next));
    };

    const handleResetRateSettings = () => {
        resetSettings();
        setTargetDraft(String(DEFAULT_COST_RATE_SETTINGS.targetCostRate));
        setWarnDraft(String(DEFAULT_COST_RATE_SETTINGS.warnCostRate));
        setDangerDraft(String(DEFAULT_COST_RATE_SETTINGS.dangerCostRate));
    };

    const handleReset = async () => {
        if (confirm('本当にすべてのデータを削除しますか？この操作は取り消せません。')) {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData.user) {
                alert('ログイン状態を確認できません。');
                return;
            }

            const userId = userData.user.id;
            const recipeRes = await supabase.from('recipes').delete().eq('user_id', userId);
            if (recipeRes.error) {
                alert(`レシピ削除に失敗: ${recipeRes.error.message}`);
                return;
            }

            const menuRes = await supabase.from('menus').delete().eq('user_id', userId);
            if (menuRes.error) {
                alert(`メニュー削除に失敗: ${menuRes.error.message}`);
                return;
            }

            const materialRes = await supabase.from('materials').delete().eq('user_id', userId);
            if (materialRes.error) {
                alert(`材料削除に失敗: ${materialRes.error.message}`);
                return;
            }

            await db.transaction('rw', db.materials, db.menus, db.recipes, async () => {
                await db.materials.clear();
                await db.menus.clear();
                await db.recipes.clear();
            });
            alert('データを初期化しました。');
        }
    };

    const hasMissingColumn = (errorMessage: string, columns: string[]) => {
        const normalized = errorMessage.toLowerCase();
        return columns.some((column) => normalized.includes(column.toLowerCase()));
    };

    const canRetryWithFallback = (errorMessage: string) => {
        const normalized = errorMessage.toLowerCase();
        return hasMissingColumn(errorMessage, ['unit', 'base_unit', 'yield_rate'])
            || normalized.includes('null value in column "base_unit"')
            || (normalized.includes('violates not-null constraint') && normalized.includes('base_unit'));
    };

    const handleSeedBasicMaterials = async () => {
        if (isSeedingMaterials) return;
        setIsSeedingMaterials(true);

        try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData.user) {
                alert('ログイン状態を確認できません。');
                return;
            }

            const userId = userData.user.id;
            const { data: existingMaterials, error: existingError } = await supabase
                .from('materials')
                .select('name')
                .eq('user_id', userId);

            if (existingError) {
                alert(`既存材料の確認に失敗しました: ${existingError.message}`);
                return;
            }

            const existingNames = new Set(
                (existingMaterials ?? [])
                    .map((row) => String(row.name ?? '').trim())
                    .filter((name) => name.length > 0)
            );

            const materialsToInsert = BASIC_MATERIAL_SEEDS.filter(
                (seed) => !existingNames.has(seed.name.trim())
            );

            if (materialsToInsert.length === 0) {
                alert('追加できる基本の材料はありません。');
                setIsSeedConfirmOpen(false);
                return;
            }

            const createPayload = (mode: 'unit' | 'unit_with_base' | 'base', includeYieldRate: boolean) => (
                materialsToInsert.map((seed) => {
                    const row: Record<string, unknown> = {
                        id: crypto.randomUUID(),
                        user_id: userId,
                        name: seed.name,
                        category: seed.category,
                    };

                    if (mode === 'unit' || mode === 'unit_with_base') {
                        row.unit = seed.unit;
                    }
                    if (mode === 'base' || mode === 'unit_with_base') {
                        row.base_unit = seed.unit;
                    }
                    if (includeYieldRate) {
                        row.yield_rate = seed.yield_rate;
                    }

                    return row;
                })
            );

            const insertAttempts: Array<{ mode: 'unit' | 'unit_with_base' | 'base'; includeYieldRate: boolean }> = [
                { mode: 'unit', includeYieldRate: true },
                { mode: 'unit_with_base', includeYieldRate: true },
                { mode: 'base', includeYieldRate: true },
                { mode: 'unit', includeYieldRate: false },
                { mode: 'unit_with_base', includeYieldRate: false },
                { mode: 'base', includeYieldRate: false },
            ];

            let insertError: string | null = null;
            for (const attempt of insertAttempts) {
                const { error } = await supabase.from('materials').insert(createPayload(attempt.mode, attempt.includeYieldRate));
                if (!error) {
                    insertError = null;
                    break;
                }
                insertError = error.message;
                if (!canRetryWithFallback(error.message)) {
                    break;
                }
            }

            if (insertError) {
                alert(`基本の材料追加に失敗しました: ${insertError}`);
                return;
            }

            setIsSeedConfirmOpen(false);
            if (materialsToInsert.length === BASIC_MATERIAL_SEEDS.length) {
                alert('基本の材料を50件追加しました');
            } else {
                alert(`基本の材料を${materialsToInsert.length}件追加しました`);
            }
        } finally {
            setIsSeedingMaterials(false);
        }
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert(`ログアウトに失敗しました: ${error.message}`);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in">
            <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground">設定</h2>
                <p className="text-muted-foreground mt-1">アプリケーションの管理と設定を行います。</p>
            </div>

            <Card className="bg-card border-border shadow-xl">
                <CardHeader className="border-b border-border pb-4">
                    <CardTitle className="text-lg">原価率しきい値</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <p className="text-sm text-muted-foreground">原価率の評価基準を設定します。入力後にフォーカスを外すと保存されます。</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">目標(%)</label>
                            <Input
                                type="text"
                                inputMode="decimal"
                                value={targetDraft}
                                onChange={(e) => setTargetDraft(e.target.value.replace(/[^\d.]/g, ''))}
                                onBlur={handleBlurTarget}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">警告(%)</label>
                            <Input
                                type="text"
                                inputMode="decimal"
                                value={warnDraft}
                                onChange={(e) => setWarnDraft(e.target.value.replace(/[^\d.]/g, ''))}
                                onBlur={handleBlurWarn}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">危険(%)</label>
                            <Input
                                type="text"
                                inputMode="decimal"
                                value={dangerDraft}
                                onChange={(e) => setDangerDraft(e.target.value.replace(/[^\d.]/g, ''))}
                                onBlur={handleBlurDanger}
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <p>現在値: 目標 {settings.targetCostRate}% / 警告 {settings.warnCostRate}% / 危険 {settings.dangerCostRate}%</p>
                        <Button variant="outline" size="sm" onClick={handleResetRateSettings}>デフォルトに戻す</Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-xl">
                <CardHeader className="border-b border-border pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrashIcon className="h-5 w-5 text-red-500" />
                        データ管理
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                        登録されたすべての材料、メニュー、レシピデータをデータベースから完全に削除します。
                        <br />
                        <span className="text-red-500/80 font-bold block mt-2 underline decoration-red-500/30">※ この操作は元に戻すことができません。</span>
                    </p>
                    <Button variant="destructive" onClick={handleReset} className="w-full sm:w-auto font-bold uppercase tracking-wider px-8">
                        すべてのデータをリセット
                    </Button>

                    <div className="mt-8 border-t border-border pt-6">
                        <h3 className="text-base font-semibold text-foreground">基本の材料を追加</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                            飲食店でよく使う基本の材料をまとめて登録します
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => setIsSeedConfirmOpen(true)}
                            className="mt-4 w-full sm:w-auto font-bold tracking-wider px-8"
                            disabled={isSeedingMaterials}
                        >
                            材料を追加する
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-xl">
                <CardHeader className="border-b border-border pb-4">
                    <CardTitle className="text-lg">アカウント</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                    <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground space-y-1">
                        <p>ログインメール: <span className="font-medium text-foreground">{currentUserEmail ?? '未ログイン'}</span></p>
                    </div>
                    <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
                        ログアウト
                    </Button>
                    <div>
                        <a
                            href="https://forms.gle/xqf6JpxL6JGnZ1xx5"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 h-11 px-5 py-2 border border-input bg-background hover:bg-accent/70 hover:text-accent-foreground w-full sm:w-auto"
                        >
                            解約はこちら
                        </a>
                    </div>
                    <a href="/terms" className="block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
                        利用規約
                    </a>
                    <a href="/privacy" className="block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
                        プライバシーポリシー
                    </a>
                </CardContent>
            </Card>

            <div className="flex flex-col items-center gap-2 text-muted-foreground/50 pt-12">
                <div className="h-px w-12 bg-border mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Cost Calculator App</p>
                <p className="text-[10px] opacity-40">v1.0.0 • Professional Edition</p>
            </div>

            {isSeedConfirmOpen && (
                <div className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-[1px] flex items-center justify-center px-4">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4">
                        <h3 className="text-lg font-bold text-foreground">
                            基本の材料（50件）を追加しますか？
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            価格と仕入数量は登録されません。あとで編集できます。
                        </p>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsSeedConfirmOpen(false)}
                                disabled={isSeedingMaterials}
                            >
                                キャンセル
                            </Button>
                            <Button
                                onClick={handleSeedBasicMaterials}
                                disabled={isSeedingMaterials}
                            >
                                {isSeedingMaterials ? '追加中...' : '追加する'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TrashIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
);
