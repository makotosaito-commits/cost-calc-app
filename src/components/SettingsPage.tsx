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
    unit: 'g' | 'ml' | '個' | '枚';
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
    { name: 'ほうれん草', category: '野菜', unit: 'g', yield_rate: 90 },
    { name: '小松菜', category: '野菜', unit: 'g', yield_rate: 90 },
    { name: '水菜', category: '野菜', unit: 'g', yield_rate: 95 },
    { name: '白菜', category: '野菜', unit: 'g', yield_rate: 85 },
    { name: '大根', category: '野菜', unit: 'g', yield_rate: 85 },
    { name: 'かぼちゃ', category: '野菜', unit: 'g', yield_rate: 80 },
    { name: 'ブロッコリー', category: '野菜', unit: 'g', yield_rate: 75 },
    { name: 'カリフラワー', category: '野菜', unit: 'g', yield_rate: 75 },
    { name: 'アスパラガス', category: '野菜', unit: 'g', yield_rate: 80 },
    { name: 'セロリ', category: '野菜', unit: 'g', yield_rate: 85 },
    { name: 'ズッキーニ', category: '野菜', unit: 'g', yield_rate: 90 },
    { name: 'オクラ', category: '野菜', unit: 'g', yield_rate: 90 },
    { name: 'とうもろこし', category: '野菜', unit: 'g', yield_rate: 70 },
    { name: '枝豆', category: '野菜', unit: 'g', yield_rate: 60 },
    { name: 'もやし', category: '野菜', unit: 'g', yield_rate: 95 },
    { name: '春菊', category: '野菜', unit: 'g', yield_rate: 85 },
    { name: 'パプリカ', category: '野菜', unit: 'g', yield_rate: 90 },
    { name: 'しめじ', category: '野菜', unit: 'g', yield_rate: 100 },
    { name: 'えのき', category: '野菜', unit: 'g', yield_rate: 100 },
    { name: 'エリンギ', category: '野菜', unit: 'g', yield_rate: 100 },
    { name: '豚バラ肉', category: '肉', unit: 'g', yield_rate: 90 },
    { name: '豚ロース肉', category: '肉', unit: 'g', yield_rate: 90 },
    { name: '鶏ささみ', category: '肉', unit: 'g', yield_rate: 95 },
    { name: '鶏手羽先', category: '肉', unit: 'g', yield_rate: 80 },
    { name: '鶏手羽元', category: '肉', unit: 'g', yield_rate: 85 },
    { name: '合いびき肉', category: '肉', unit: 'g', yield_rate: 100 },
    { name: 'ソーセージ', category: '肉', unit: 'g', yield_rate: 100 },
    { name: 'ハム', category: '肉', unit: 'g', yield_rate: 100 },
    { name: 'サバ', category: '魚', unit: 'g', yield_rate: 80 },
    { name: 'アジ', category: '魚', unit: 'g', yield_rate: 80 },
    { name: 'イワシ', category: '魚', unit: 'g', yield_rate: 75 },
    { name: 'カツオ', category: '魚', unit: 'g', yield_rate: 85 },
    { name: 'ホタテ', category: '魚', unit: 'g', yield_rate: 100 },
    { name: 'あさり', category: '魚', unit: 'g', yield_rate: 30 },
    { name: 'ムール貝', category: '魚', unit: 'g', yield_rate: 35 },
    { name: 'カニ', category: '魚', unit: 'g', yield_rate: 40 },
    { name: 'ヨーグルト', category: '卵・乳製品', unit: 'g', yield_rate: 100 },
    { name: 'クリームチーズ', category: '卵・乳製品', unit: 'g', yield_rate: 100 },
    { name: 'モッツァレラチーズ', category: '卵・乳製品', unit: 'g', yield_rate: 100 },
    { name: '粉チーズ', category: '卵・乳製品', unit: 'g', yield_rate: 100 },
    { name: 'うどん', category: '主食', unit: 'g', yield_rate: 100 },
    { name: 'そば', category: '主食', unit: 'g', yield_rate: 100 },
    { name: '中華麺', category: '主食', unit: 'g', yield_rate: 100 },
    { name: '餃子の皮', category: '主食', unit: '枚', yield_rate: 100 },
    { name: '春巻きの皮', category: '主食', unit: '枚', yield_rate: 100 },
    { name: 'だし', category: '調味料', unit: 'ml', yield_rate: 100 },
    { name: '鶏ガラスープ', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: 'コンソメ', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: 'めんつゆ', category: '調味料', unit: 'ml', yield_rate: 100 },
    { name: 'ポン酢', category: '調味料', unit: 'ml', yield_rate: 100 },
    { name: 'オリーブオイル', category: '調味料', unit: 'ml', yield_rate: 100 },
    { name: 'ラー油', category: '調味料', unit: 'ml', yield_rate: 100 },
    { name: '豆板醤', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: '甜麺醤', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: 'コチュジャン', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: 'カレールー', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: 'わさび', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: 'からし', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: 'ブラックペッパー', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: '白ごま', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: 'すりごま', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: '鰹節', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: '海苔', category: '調味料', unit: '枚', yield_rate: 100 },
    { name: 'みつば', category: '野菜', unit: 'g', yield_rate: 85 },
    { name: '大葉', category: '野菜', unit: 'g', yield_rate: 95 },
    { name: 'みょうが', category: '野菜', unit: 'g', yield_rate: 90 },
    { name: 'ごぼう', category: '野菜', unit: 'g', yield_rate: 75 },
    { name: 'れんこん', category: '野菜', unit: 'g', yield_rate: 80 },
    { name: '里いも', category: '野菜', unit: 'g', yield_rate: 75 },
    { name: 'さつまいも', category: '野菜', unit: 'g', yield_rate: 85 },
    { name: '山いも', category: '野菜', unit: 'g', yield_rate: 85 },
    { name: 'チンゲン菜', category: '野菜', unit: 'g', yield_rate: 90 },
    { name: '菜の花', category: '野菜', unit: 'g', yield_rate: 85 },
    { name: 'ししとう', category: '野菜', unit: 'g', yield_rate: 95 },
    { name: 'さやいんげん', category: '野菜', unit: 'g', yield_rate: 90 },
    { name: 'スナップえんどう', category: '野菜', unit: 'g', yield_rate: 70 },
    { name: 'グリーンアスパラ', category: '野菜', unit: 'g', yield_rate: 80 },
    { name: '赤パプリカ', category: '野菜', unit: 'g', yield_rate: 90 },
    { name: '黄パプリカ', category: '野菜', unit: 'g', yield_rate: 90 },
    { name: 'マッシュルーム', category: '野菜', unit: 'g', yield_rate: 100 },
    { name: 'まいたけ', category: '野菜', unit: 'g', yield_rate: 100 },
    { name: 'きくらげ', category: '野菜', unit: 'g', yield_rate: 100 },
    { name: 'アボカド', category: '野菜', unit: 'g', yield_rate: 70 },
    { name: '牛すじ肉', category: '肉', unit: 'g', yield_rate: 85 },
    { name: '牛タン', category: '肉', unit: 'g', yield_rate: 90 },
    { name: '牛もも肉', category: '肉', unit: 'g', yield_rate: 90 },
    { name: '豚トロ', category: '肉', unit: 'g', yield_rate: 90 },
    { name: '豚肩ロース肉', category: '肉', unit: 'g', yield_rate: 90 },
    { name: '鶏皮', category: '肉', unit: 'g', yield_rate: 100 },
    { name: 'ロースハム', category: '肉', unit: 'g', yield_rate: 100 },
    { name: '生ハム', category: '肉', unit: 'g', yield_rate: 100 },
    { name: 'チャーシュー', category: '肉', unit: 'g', yield_rate: 100 },
    { name: '焼豚', category: '肉', unit: 'g', yield_rate: 100 },
    { name: 'ぶり', category: '魚', unit: 'g', yield_rate: 85 },
    { name: 'たい', category: '魚', unit: 'g', yield_rate: 85 },
    { name: 'たら', category: '魚', unit: 'g', yield_rate: 85 },
    { name: 'ししゃも', category: '魚', unit: 'g', yield_rate: 80 },
    { name: 'うなぎ', category: '魚', unit: 'g', yield_rate: 90 },
    { name: '牡蠣', category: '魚', unit: 'g', yield_rate: 85 },
    { name: 'しじみ', category: '魚', unit: 'g', yield_rate: 25 },
    { name: 'いくら', category: '魚', unit: 'g', yield_rate: 100 },
    { name: '明太子', category: '魚', unit: 'g', yield_rate: 100 },
    { name: 'たらこ', category: '魚', unit: 'g', yield_rate: 100 },
    { name: '豆腐', category: '卵・乳製品', unit: 'g', yield_rate: 100 },
    { name: '絹ごし豆腐', category: '卵・乳製品', unit: 'g', yield_rate: 100 },
    { name: '木綿豆腐', category: '卵・乳製品', unit: 'g', yield_rate: 100 },
    { name: '豆乳', category: '卵・乳製品', unit: 'ml', yield_rate: 100 },
    { name: 'アイスクリーム', category: '卵・乳製品', unit: 'g', yield_rate: 100 },
    { name: '練乳', category: '卵・乳製品', unit: 'g', yield_rate: 100 },
    { name: 'カスタードクリーム', category: '卵・乳製品', unit: 'g', yield_rate: 100 },
    { name: 'サワークリーム', category: '卵・乳製品', unit: 'g', yield_rate: 100 },
    { name: 'そうめん', category: '主食', unit: 'g', yield_rate: 100 },
    { name: '焼きそば麺', category: '主食', unit: 'g', yield_rate: 100 },
    { name: 'ラーメン', category: '主食', unit: 'g', yield_rate: 100 },
    { name: 'もち', category: '主食', unit: '個', yield_rate: 100 },
    { name: 'バンズ', category: '主食', unit: '個', yield_rate: 100 },
    { name: 'ピザ生地', category: '主食', unit: '枚', yield_rate: 100 },
    { name: 'トルティーヤ', category: '主食', unit: '枚', yield_rate: 100 },
    { name: 'ごはん', category: '主食', unit: 'g', yield_rate: 100 },
    { name: '天ぷら粉', category: '粉類', unit: 'g', yield_rate: 100 },
    { name: 'ホットケーキミックス', category: '粉類', unit: 'g', yield_rate: 100 },
    { name: 'コーンスターチ', category: '粉類', unit: 'g', yield_rate: 100 },
    { name: '強力粉', category: '粉類', unit: 'g', yield_rate: 100 },
    { name: '薄力粉', category: '粉類', unit: 'g', yield_rate: 100 },
    { name: 'しょうゆだれ', category: '調味料', unit: 'ml', yield_rate: 100 },
    { name: '焼肉のたれ', category: '調味料', unit: 'ml', yield_rate: 100 },
    { name: 'とんかつソース', category: '調味料', unit: 'ml', yield_rate: 100 },
    { name: '中濃ソース', category: '調味料', unit: 'ml', yield_rate: 100 },
    { name: 'マスタード', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: '一味唐辛子', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: '七味唐辛子', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: 'にんにくチューブ', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: 'しょうがチューブ', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: '柚子胡椒', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: '塩こしょう', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: 'バジル', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: 'パセリ', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: 'ローリエ', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: 'シナモン', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: 'はちみつ', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: 'メープルシロップ', category: '調味料', unit: 'ml', yield_rate: 100 },
    { name: 'ジャム', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: 'トマトピューレ', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: 'トマトソース', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: 'デミグラスソース', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: 'ホワイトソース', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: 'ごまだれ', category: '調味料', unit: 'ml', yield_rate: 100 },
    { name: 'ナンプラー', category: '調味料', unit: 'ml', yield_rate: 100 },
    { name: 'オイスターソース', category: '調味料', unit: 'g', yield_rate: 100 },
    { name: '練りごま', category: '調味料', unit: 'g', yield_rate: 100 },
];
const BASIC_MATERIAL_TOTAL = BASIC_MATERIAL_SEEDS.length;

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

    const getCurrentUserId = async () => {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            throw new Error('ログイン状態を確認できません。');
        }
        return userData.user.id;
    };

    const resetUserData = async (userId: string) => {
        const recipeRes = await supabase.from('recipes').delete().eq('user_id', userId);
        if (recipeRes.error) {
            throw new Error(`レシピ削除に失敗: ${recipeRes.error.message}`);
        }

        const menuRes = await supabase.from('menus').delete().eq('user_id', userId);
        if (menuRes.error) {
            throw new Error(`メニュー削除に失敗: ${menuRes.error.message}`);
        }

        const materialRes = await supabase.from('materials').delete().eq('user_id', userId);
        if (materialRes.error) {
            throw new Error(`材料削除に失敗: ${materialRes.error.message}`);
        }

        await db.transaction('rw', db.materials, db.menus, db.recipes, async () => {
            await db.materials.clear();
            await db.menus.clear();
            await db.recipes.clear();
        });
    };

    const createSeedPayload = (
        userId: string,
        seeds: BasicMaterialSeed[],
        mode: 'unit' | 'unit_with_base' | 'base',
        includeYieldRate: boolean
    ) => (
        seeds.map((seed) => {
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

    const insertBasicMaterials = async (userId: string, seeds: BasicMaterialSeed[]) => {
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
            const payload = createSeedPayload(userId, seeds, attempt.mode, attempt.includeYieldRate);
            const { error } = await supabase.from('materials').insert(payload);
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
            throw new Error(`基本の材料追加に失敗しました: ${insertError}`);
        }
    };

    const handleReset = async () => {
        if (!confirm('本当にすべてのデータを削除しますか？この操作は取り消せません。')) {
            return;
        }

        try {
            const userId = await getCurrentUserId();
            await resetUserData(userId);
            alert('データを初期化しました。');
        } catch (error) {
            alert(error instanceof Error ? error.message : 'データ初期化に失敗しました。');
        }
    };

    const handleSeedBasicMaterials = async () => {
        if (isSeedingMaterials) return;
        setIsSeedingMaterials(true);

        try {
            const userId = await getCurrentUserId();
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

            const seenNames = new Set(existingNames);
            const materialsToInsert = BASIC_MATERIAL_SEEDS.filter((seed) => {
                const normalizedName = seed.name.trim();
                if (!normalizedName || seenNames.has(normalizedName)) {
                    return false;
                }
                seenNames.add(normalizedName);
                return true;
            });

            if (materialsToInsert.length === 0) {
                alert('追加できる基本の材料はありません。');
                setIsSeedConfirmOpen(false);
                return;
            }
            await insertBasicMaterials(userId, materialsToInsert);

            setIsSeedConfirmOpen(false);
            alert(`基本の材料を${materialsToInsert.length}件追加しました`);
        } catch (error) {
            alert(error instanceof Error ? error.message : '基本の材料追加に失敗しました。');
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
                <p className="text-muted-foreground mt-1">アプリで使う基本設定を変更できます。</p>
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
                    <Button
                        variant="destructive"
                        onClick={handleReset}
                        className="w-full sm:w-auto font-bold uppercase tracking-wider px-8"
                        disabled={isSeedingMaterials}
                    >
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
                            基本の材料（{BASIC_MATERIAL_TOTAL}件）を追加しますか？
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
