import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

export const ResetPasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [hasRecoverySession, setHasRecoverySession] = useState(false);

    useEffect(() => {
        let mounted = true;

        const checkSession = async () => {
            const { data, error } = await supabase.auth.getSession();
            if (!mounted) return;
            if (error) {
                setMessage(error.message);
                return;
            }
            setHasRecoverySession(Boolean(data.session));
        };

        checkSession();

        return () => {
            mounted = false;
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!hasRecoverySession) {
            setMessage('有効な再設定リンクではありません。ログイン画面から再度メールを送信してください。');
            return;
        }

        if (password.length < 8) {
            setMessage('パスワードは8文字以上で入力してください。');
            return;
        }

        if (password !== confirmPassword) {
            setMessage('確認用パスワードが一致しません。');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (error) {
            setMessage(error.message);
            return;
        }

        setPassword('');
        setConfirmPassword('');
        setMessage('パスワードを更新しました。ログイン画面へ戻ってログインしてください。');
    };

    return (
        <div className="min-h-dvh w-full flex items-center justify-center px-4 py-8">
            <Card className="w-full max-w-md bg-card border-border shadow-lg">
                <CardHeader className="space-y-2">
                    <CardTitle className="text-2xl font-bold">新しいパスワードを設定</CardTitle>
                    <p className="text-sm text-muted-foreground">メールのリンクから開いた場合のみ設定できます。</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">新しいパスワード</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="8文字以上"
                                minLength={8}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">確認用パスワード</label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="もう一度入力"
                                minLength={8}
                                required
                            />
                        </div>

                        {message && <p className="text-sm text-muted-foreground">{message}</p>}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? '更新中...' : 'パスワードを更新'}
                        </Button>
                    </form>

                    <a href="/" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
                        ログイン画面に戻る
                    </a>
                </CardContent>
            </Card>
        </div>
    );
};
