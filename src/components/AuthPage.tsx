import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface AuthPageProps {
    initialMessage?: string;
}

export const AuthPage = ({ initialMessage }: AuthPageProps) => {
    const [mode, setMode] = useState<'login' | 'reset'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(initialMessage ?? null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (mode === 'reset') {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) {
                setMessage(error.message);
            } else {
                setMessage('パスワード設定メールを送信しました。メール内のリンクから新しいパスワードを設定してください。');
            }
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });
        if (error) {
            setMessage(error.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-dvh w-full flex items-center justify-center px-4 py-8">
            <Card className="w-full max-w-md bg-card border-border shadow-lg">
                <CardHeader className="space-y-2">
                    <CardTitle className="text-2xl font-bold">
                        {mode === 'login' ? 'ログイン' : 'パスワード設定（再設定）'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {mode === 'login' ? 'メールアドレスとパスワードで認証します。' : 'メールアドレス宛にパスワード設定リンクを送信します。'}
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">メールアドレス</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                        {mode === 'login' && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">パスワード</label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="8文字以上"
                                    required
                                    minLength={8}
                                />
                            </div>
                        )}

                        {message && (
                            <p className="text-sm text-muted-foreground">{message}</p>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? '処理中...' : mode === 'login' ? 'ログイン' : 'パスワード設定メールを送信'}
                        </Button>
                    </form>

                    {mode === 'login' ? (
                        <div className="mt-4 flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('reset');
                                    setMessage(null);
                                }}
                                className="text-left text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                            >
                                初回の方：パスワードを設定する
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('reset');
                                    setMessage(null);
                                }}
                                className="text-left text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                            >
                                パスワードを忘れた方
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                setMode('login');
                                setMessage(null);
                            }}
                            className="mt-4 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                        >
                            ログインに戻る
                        </button>
                    )}

                    <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                        登録することで
                        <a href="/terms" className="underline underline-offset-4 hover:text-foreground">利用規約</a>
                        ・
                        <a href="/privacy" className="underline underline-offset-4 hover:text-foreground">プライバシーポリシー</a>
                        に同意したことになります
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};
