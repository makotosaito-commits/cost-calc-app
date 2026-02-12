import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface AuthPageProps {
    initialMessage?: string;
}

export const AuthPage = ({ initialMessage }: AuthPageProps) => {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(initialMessage ?? null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (mode === 'signup') {
            const { error } = await supabase.auth.signUp({
                email: email.trim(),
                password,
            });
            if (error) {
                setMessage(error.message);
            } else {
                setMessage('登録完了。確認メールが届く設定の場合はメールをご確認ください。');
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
                        {mode === 'login' ? 'ログイン' : '新規登録'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        メールアドレスとパスワードで認証します。
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

                        {message && (
                            <p className="text-sm text-muted-foreground">{message}</p>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? '処理中...' : mode === 'login' ? 'ログイン' : '登録する'}
                        </Button>
                    </form>

                    <button
                        type="button"
                        onClick={() => {
                            setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
                            setMessage(null);
                        }}
                        className="mt-4 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                    >
                        {mode === 'login' ? 'アカウントを作成する' : 'ログインに戻る'}
                    </button>
                </CardContent>
            </Card>
        </div>
    );
};
