# Cost Calc App 解析ドキュメント（初心者向け）

このドキュメントは、`cost-calc-app` の「今どう動いているか」を、コードの実装に沿って説明するものです。

## 1. このアプリは何をするものか

飲食メニューの原価を計算し、次の値を管理するSPA（シングルページアプリ）です。

- 原価合計（`total_cost`）
- 粗利益（`gross_profit`）
- 原価率（`cost_rate`）

主な流れは「材料登録 -> メニュー作成 -> レシピ入力 -> 自動計算」です。

## 2. 全体構成（どのファイルが何を担当しているか）

### 起動と画面切替

- `src/main.tsx`: Reactアプリの起動
- `src/App.tsx`: 3画面の切替管理
  - `menus`: メニュー管理
  - `materials`: 材料管理
  - `settings`: 設定

### 画面コンポーネント

- `src/components/MenuPage.tsx`
  - メニュー一覧表示
  - メニュー追加・削除
  - メニュー編集モード遷移
- `src/components/MenuDetail.tsx`
  - メニュー名、販売価格、画像の編集
  - 原価・粗利益・原価率の表示
- `src/components/RecipeEditor.tsx`
  - レシピ行（材料、使用量、単位）の編集
  - レシピ合計原価の計算通知
- `src/components/MaterialForm.tsx`
  - 材料の登録
  - 単価のリアルタイム計算
- `src/components/MaterialList.tsx`
  - 材料一覧表示と削除
- `src/components/SettingsPage.tsx`
  - 全データの初期化（削除）
- `src/components/Layout.tsx`, `src/components/BottomNav.tsx`
  - レイアウト、画面下ナビ

### データアクセス層

- `src/lib/db.ts`
  - DexieでIndexedDBテーブルを定義
  - `materials`, `menus`, `recipes`
- `src/hooks/useMaterials.ts`
  - 材料CRUD
- `src/hooks/useMenus.ts`
  - メニューCRUD
  - メニュー削除時に関連レシピも削除
- `src/hooks/useRecipes.ts`
  - レシピCRUD

### 計算ロジック

- `src/lib/calculator.ts`
  - `calculateUnitPrice`: 単価計算
  - `normalizeAmount`: 単位正規化（`kg -> g`, `L -> ml`）
  - `calculateLineCost`: レシピ1行の原価計算
- `src/lib/calculator.test.ts`
  - 上記関数のユニットテスト

### 将来向け連携

- `src/lib/supabase.ts`
  - Supabaseクライアント初期化
- `supabase_schema.sql`
  - Supabase向けスキーマ定義（現行UIとは未統合）

## 3. 使用技術

- フロントエンド: `React 18`, `TypeScript`, `Vite`
- UI: `Tailwind CSS` + 独自UIコンポーネント
- ローカルDB: `Dexie`, `dexie-react-hooks`
- 外部連携準備: `@supabase/supabase-js`
- テスト: `Vitest`

補足:
- 現在の主DBはSupabaseではなく、ブラウザ内のIndexedDBです。

## 4. 現在の動作フロー

### 4-1. 材料を登録する

1. `MaterialForm` で名前・価格・数量・単位を入力
2. `normalizeAmount` で数量を基準単位に合わせる
3. `calculateUnitPrice` で基準単価を計算
4. `useMaterials.addMaterial` でIndexedDBへ保存

### 4-2. メニューを作る

1. `MenuPage` の新規作成でメニューを追加
2. 初期値として売価・原価は0で作成される

### 4-3. レシピを作る

1. `RecipeEditor` で材料を選び、レシピ行を追加
2. 使用量・単位を入力
3. 行ごとに `calculateLineCost` で原価を計算
4. 全行合計を `onTotalCostChange` で親へ通知

### 4-4. メニュー指標を更新する

1. 親コンポーネント（`MenuPage`）で合計原価を受け取る
2. `gross_profit` と `cost_rate` を再計算
3. `useMenus.updateMenu` で保存

### 4-5. データを初期化する

1. `SettingsPage` で確認ダイアログ
2. `materials`, `menus`, `recipes` を全削除

## 5. 将来問題になりやすいポイント

### 優先度1: 材料削除時の整合性

- 現状:
  - `useMaterials.deleteMaterial` は材料のみ削除
  - その材料を使うレシピ行が残る可能性がある
- 影響:
  - 画面で `Unknown` 表示
  - 原価が0扱いになる行が出る

### 優先度2: データがローカル限定

- 現状:
  - IndexedDB保存のみ
- 影響:
  - 端末変更やブラウザ削除で消える
  - 複数端末同期ができない

### 優先度3: Supabaseスキーマとの不一致

- 現状:
  - `supabase_schema.sql` の列設計と `src/types.ts` が一致していない
- 影響:
  - 将来クラウド同期を始める際に移行コストが大きくなる

### 優先度4: 画像保存サイズ

- 現状:
  - 画像をBase64で保存（`MenuDetail`）
- 影響:
  - DB肥大化、読み書き性能低下

### 優先度5: レンダリング中の状態更新

- 現状:
  - `MenuPage` にレンダー内 `setSelectedMenuId(null)` がある
- 影響:
  - 再描画の不安定化要因になりうる

### 優先度6: 歩留まりが固定運用

- 現状:
  - 型には `yield_rate` があるが、実装上は100%固定で計算
- 影響:
  - 歩留まり仕様を戻す際に影響範囲が広い

### 優先度7: テスト範囲

- 現状:
  - 計算ロジックのユニットテスト中心
- 影響:
  - 画面連携、DB整合性、削除連鎖などの回帰検知が弱い

## 6. 現時点の確認結果

- `npm test -- --run` 実行済み
- `src/lib/calculator.test.ts` の8テストは通過

## 7. まず次に着手するなら（推奨順）

1. 材料削除時に関連レシピも削除する（または削除禁止）
2. `MenuPage` のレンダー中 state 更新を解消する
3. Supabase連携方針に合わせて型・スキーマを統一する
4. 画像保存方式をBase64から外部ストレージ参照へ変更する
5. hooks/画面連携テストを追加する
