type LegalPageType = 'terms' | 'privacy';

type LegalPageProps = {
    type: LegalPageType;
};

const LinkRow = () => (
    <div className="flex items-center gap-4 text-sm">
        <a href="/" className="text-muted-foreground underline underline-offset-4 hover:text-foreground">アプリに戻る</a>
        <a href="/terms" className="text-muted-foreground underline underline-offset-4 hover:text-foreground">利用規約</a>
        <a href="/privacy" className="text-muted-foreground underline underline-offset-4 hover:text-foreground">プライバシーポリシー</a>
    </div>
);

const TermsContent = () => (
    <div className="space-y-4 text-sm leading-7 text-foreground">
        <p>利用規約</p>
        <p>（制定日：2025年2月19日）</p>
        <p>本利用規約（以下「本規約」）は、WAV（運営者：齊藤 真）（以下「運営者」）が提供する原価管理アプリ「Costa App」（以下「本サービス」）の利用条件を定めるものです。利用者は、本規約に同意のうえ本サービスをご利用ください。</p>
        <p>第1条（適用）<br />本規約は、利用者と運営者との間における本サービスの利用に関わる一切の関係に適用されます。</p>
        <p>第2条（アカウント登録）</p>
        <ol className="list-decimal pl-5 space-y-1">
            <li>利用者は、メールアドレスおよびパスワードを用いてアカウント登録を行います。</li>
            <li>登録情報は正確かつ最新の情報を入力してください。</li>
            <li>アカウント情報の管理は利用者の責任において行うものとします。</li>
        </ol>
        <p>第3条（料金・支払い）</p>
        <ol className="list-decimal pl-5 space-y-1">
            <li>本サービスの利用料金は月額3,000円（税込）です。</li>
            <li>利用者は、運営者が案内するStripe決済ページにてクレジットカード情報を登録し、以後毎月自動で課金されます。</li>
            <li>初回決済日を基準として毎月同日に自動課金が行われます。</li>
            <li>決済確認後、24時間以内に本サービスを利用できます。</li>
        </ol>
        <p>第4条（解約・返金）</p>
        <ol className="list-decimal pl-5 space-y-1">
            <li>解約を希望する場合は、アプリ内の「解約はこちら」よりお申し込みください。</li>
            <li>次回決済日の前日までに解約申請が完了した場合、翌月以降の課金は停止されます。</li>
            <li>既に支払済みの利用料金については、法令に定める場合を除き返金いたしません。</li>
        </ol>
        <p>第5条（禁止事項）<br />利用者は、本サービスの転売・貸与、不正アクセス、法令または公序良俗に違反する行為、その他運営者が不適切と判断する行為を行ってはなりません。</p>
        <p>第6条（サービスの変更・停止）<br />運営者は、合理的な理由がある場合、事前の通知または本サービス上での告知により、本サービスの内容の変更または提供の停止を行うことがあります。</p>
        <p>第7条（免責事項）</p>
        <ol className="list-decimal pl-5 space-y-1">
            <li>運営者は、本サービスの利用により利用者に生じた損害について、運営者の故意または重過失による場合を除き、一切の責任を負いません。</li>
            <li>本サービスの計算結果は参考値であり、最終的な経営判断は利用者の責任において行うものとします。</li>
        </ol>
        <p>第8条（規約の変更）<br />運営者は必要に応じて本規約を変更することがあります。変更後の規約は本サービス上に掲示された時点で効力を生じます。</p>
        <p>第9条（準拠法・管轄裁判所）<br />本規約は日本法に準拠します。本サービスに関して紛争が生じた場合、運営者の所在地を管轄する地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
        <p className="font-semibold pt-2">特定商取引法に基づく表記</p>
        <p>【販売業者名】WAV（代表者：齊藤 真）</p>
        <p>【所在地】消費者庁のガイドラインに基づき、請求があった場合に遅滞なく開示いたします。開示をご希望の方は下記メールアドレスまでご連絡ください。</p>
        <p>【電話番号】請求があった場合に遅滞なく開示いたします。</p>
        <p>【メールアドレス】makotosaito@craftbit.jp</p>
        <p>【サービス名】Costa App</p>
        <p>【販売価格】月額3,000円（税込）</p>
        <p>【代金の支払方法】クレジットカード決済（Stripeによる自動課金）</p>
        <p>【代金の支払時期】初回：申込時、次月以降：毎月同日に自動課金</p>
        <p>【商品の引渡時期】決済確認後、24時間以内にアカウントを有効化いたします。</p>
        <p>【返品・返金】サービスの性質上、決済完了後の返金・返品は原則としてお受けできません。</p>
        <p>【解約について】アプリ内の「解約はこちら」よりいつでも解約可能です。次回決済日の前日までに解約いただければ、翌月以降の課金は発生しません。</p>
        <p>【動作環境】インターネット接続環境および対応ブラウザ（PWA）</p>
    </div>
);

const PrivacyContent = () => (
    <div className="space-y-4 text-sm leading-7 text-foreground">
        <p>プライバシーポリシー</p>
        <p>（制定日：2025年2月19日）</p>
        <p>WAV（運営者：齊藤 真）は、本サービス「Costa App」における利用者の個人情報の取扱いについて以下のとおり定めます。</p>
        <p>第1条（収集する情報）</p>
        <ul className="list-disc pl-5 space-y-1">
            <li>メールアドレス</li>
            <li>登録したメニュー・材料・レシピデータ</li>
            <li>利用状況ログ</li>
        </ul>
        <p>第2条（利用目的）</p>
        <ul className="list-disc pl-5 space-y-1">
            <li>本サービスの提供・運営</li>
            <li>ユーザーサポート対応</li>
            <li>サービス改善</li>
            <li>重要なお知らせの送付</li>
        </ul>
        <p>第3条（第三者提供）<br />運営者は、法令に基づく場合を除き、利用者の同意なく第三者へ提供しません。なお、決済処理のため外部決済サービス（Stripe）を利用します。クレジットカード情報は本サービスでは保持しません。</p>
        <p>第4条（データ管理）<br />適切な安全管理措置を講じ、不正アクセス・漏洩・改ざんを防止します。</p>
        <p>第5条（データ削除）<br />利用者はアプリ内機能よりデータ削除が可能です。アカウント削除は所定の方法により申請してください。</p>
        <p>第6条（ポリシー変更）<br />本ポリシーは必要に応じて変更されます。</p>
    </div>
);

export const LegalPage = ({ type }: LegalPageProps) => {
    const isTerms = type === 'terms';

    return (
        <div className="min-h-dvh bg-background text-foreground">
            <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-8">
                <LinkRow />
                <section className="bg-card border border-border rounded-2xl p-5 md:p-8 shadow-sm">
                    {isTerms ? <TermsContent /> : <PrivacyContent />}
                </section>
            </main>
        </div>
    );
};
