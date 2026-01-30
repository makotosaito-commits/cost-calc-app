import { db } from '../lib/db';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

export const SettingsPage = () => {
    const handleReset = async () => {
        if (confirm('本当にすべてのデータを削除しますか？この操作は取り消せません。')) {
            await db.transaction('rw', db.materials, db.menus, db.recipes, async () => {
                await db.materials.clear();
                await db.menus.clear();
                await db.recipes.clear();
            });
            alert('データを初期化しました。');
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
                </CardContent>
            </Card>

            <div className="flex flex-col items-center gap-2 text-muted-foreground/50 pt-12">
                <div className="h-px w-12 bg-border mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Cost Calculator App</p>
                <p className="text-[10px] opacity-40">v1.0.0 • Professional Edition</p>
            </div>
        </div>
    );
};

const TrashIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
);
