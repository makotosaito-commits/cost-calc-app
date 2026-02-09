# Cost Calc App

飲食メニューの原価をブラウザ上で計算・管理する SPA です。  
現在はローカル保存（IndexedDB）で動作し、材料・レシピ入力から原価率までを即時計算できます。

詳細な解析ドキュメントは `docs/app-analysis-ja.md` を参照してください。

## 主な機能

- 材料登録（仕入価格・数量・単位から基準単価を自動算出）
- メニュー作成
- レシピ編集（材料、使用量、単位）
- 原価合計・粗利益・原価率の自動更新
- 設定画面から全データ初期化

## 技術スタック

- `React 18`
- `TypeScript`
- `Vite`
- `Tailwind CSS`
- `Dexie` + `dexie-react-hooks`（IndexedDB）
- `Vitest`
- `@supabase/supabase-js`（導入済み、現状未統合）

## セットアップ

前提:
- Node.js 18 以上推奨
- npm 利用

```bash
npm install
```

## 起動・ビルド・テスト

```bash
# 開発サーバー
npm run dev

# 本番ビルド
npm run build

# ビルド結果のプレビュー
npm run preview

# テスト
npm test -- --run
```

## 画面構成

- `メニュー`:
  - メニュー一覧
  - メニュー詳細（販売価格、画像、収益指標）
  - レシピ編集
- `材料`:
  - 材料登録
  - 材料一覧
- `設定`:
  - 全データ削除

## データモデル（現行）

- `Material`:
  - `name`, `purchase_price`, `purchase_quantity`, `base_unit`, `calculated_unit_price`
- `Menu`:
  - `name`, `sales_price`, `total_cost`, `gross_profit`, `cost_rate`, `image`
- `Recipe`:
  - `menu_id`, `material_id`, `usage_amount`, `usage_unit`, `yield_rate`

定義場所: `src/types.ts`

## 主要ディレクトリ

- `src/components`: 画面コンポーネント
- `src/hooks`: Dexie CRUD フック
- `src/lib`: DB 初期化、計算ロジック、Supabase クライアント
- `docs`: ドキュメント

## 現状の制約と注意点

- 保存先はブラウザの IndexedDB（端末間同期なし）
- Supabase スキーマ（`supabase_schema.sql`）は現行 UI と未統合
- 画像は Base64 保存のためデータ肥大化しやすい
- 材料削除時に関連レシピが孤立する可能性がある

## 参考ドキュメント

- 解析資料（初心者向け）: `docs/app-analysis-ja.md`
- Supabase 想定スキーマ: `supabase_schema.sql`
