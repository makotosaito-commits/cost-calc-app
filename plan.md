# Supabase（メール+パスワード認証）後付け導入計画（調査版）

## A. 現状サマリ（いま何がどう保存されているか）

### 1) 現在の保存方式
- メインデータは `IndexedDB`（ブラウザ内DB）に保存  
  - 実装: `src/lib/db.ts`（Dexie）
  - テーブル: `materials`, `menus`, `recipes`
- 設定値の一部は `localStorage` に保存  
  - 実装: `src/lib/costRateSettings.ts`
  - キー: `costCalcSettings`

### 2) 主要データ構造（型）
- `Material`（材料）: `src/types.ts`
- `Menu`（メニュー）: `src/types.ts`
- `Recipe`（レシピ行）: `src/types.ts`

### 3) 保存・読み込み・削除の実行箇所（関数名 + ファイル）
- 材料:
  - 読み込み: `useLiveQuery(() => db.materials.toArray())` in `src/hooks/useMaterials.ts`
  - 保存: `addMaterial` in `src/hooks/useMaterials.ts`
  - 更新: `updateMaterial` in `src/hooks/useMaterials.ts`
  - 削除: `deleteMaterial` / `deleteMaterialWithRecipes` in `src/hooks/useMaterials.ts`
- メニュー:
  - 読み込み: `useLiveQuery(() => db.menus.toArray())` in `src/hooks/useMenus.ts`
  - 保存: `addMenu` in `src/hooks/useMenus.ts`
  - 更新: `updateMenu` in `src/hooks/useMenus.ts`
  - 削除: `deleteMenu`（関連レシピ削除含む）in `src/hooks/useMenus.ts`
- レシピ:
  - 読み込み: `useLiveQuery(() => db.recipes.where('menu_id').equals(menuId).toArray())` in `src/hooks/useRecipes.ts`
  - 保存: `addRecipe` in `src/hooks/useRecipes.ts`
  - 更新: `updateRecipe` in `src/hooks/useRecipes.ts`
  - 削除: `deleteRecipe` in `src/hooks/useRecipes.ts`
- 設定:
  - 読み込み: `loadCostRateSettings` in `src/lib/costRateSettings.ts`
  - 保存: `saveCostRateSettings` in `src/lib/costRateSettings.ts`

### 4) 画面遷移と状態管理
- ルーティングライブラリ未使用（`react-router` なし）
- 画面切替は `App.tsx` の `view` state（`menus/materials/settings`）
- データ取得は Dexie hooks（`useMaterials/useMenus/useRecipes`）
- レイアウトは `Layout + BottomNav`

---

## B. Supabase導入のゴール（ユーザーができること）
- メール+パスワードで新規登録（サインアップ）
- メール+パスワードでログイン/ログアウト
- ログインユーザーのデータをクラウド保存
- 端末/ブラウザを変えてもデータ継続
- 他ユーザーのデータは見えない（RLSで制御）

---

## C. 最小構成の設計案（現状構造ベース、決めつけなし）

### テーブル候補（現行 `types.ts` に沿う）
- `materials`
  - `id`, `user_id`, `name`, `category`, `purchase_price`, `purchase_quantity`, `base_unit`, `calculated_unit_price`, `created_at`, `updated_at`
- `menus`
  - `id`, `user_id`, `name`, `sales_price`, `total_cost`, `gross_profit`, `cost_rate`, `image`, `created_at`, `updated_at`
- `recipes`
  - `id`, `user_id`, `menu_id`, `material_id`, `usage_amount`, `usage_unit`, `yield_rate`, `created_at`, `updated_at`
- （任意）`profiles`
  - `id(auth.users.id)`, `email`, `created_at`

### `user_id` が必要な理由
- データ所有者をDBで明示するため
- RLSで `auth.uid() = user_id` 条件を適用するため
- 端末変更時にユーザー単位で安全に同期するため

### RLS方針（行レベル権限）
- 原則:
  - `select`: `auth.uid() = user_id`
  - `insert`: `with check (auth.uid() = user_id)`
  - `update/delete`: `auth.uid() = user_id`
- `recipes` は `menu_id/material_id` の所有確認も併用（親の `user_id` を検証）

---

## D. 実装ステップ（小さく安全に）

1. `src/lib/supabase.ts` を環境変数前提で利用確認  
   - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
   - 値の直書き禁止

2. 認証UI追加（サインアップ/ログイン/ログアウト）  
   - セッション監視 `getSession` / `onAuthStateChange`
   - 未ログイン時は認証画面、ログイン時は既存UI

3. まず1データ単位だけクラウド化（材料）  
   - `useMaterials` だけ Supabase CRUD に切替
   - 挙動確認を優先

4. 残りを順次クラウド化  
   - `useMenus` → `useRecipes`
   - 既存UI変更は最小化

5. ローカル保存（Dexie）の扱いを決定  
   - 併用（安全）か、完全移行（シンプル）かを段階的に判断

---

## E. 動作確認チェックリスト（検証手順）

1. 認証
- サインアップ成功
- ログイン成功
- ログアウト成功

2. クラウド保存
- 保存後に再読み込みして残る
- 別ブラウザ/別端末で同一アカウントのデータが見える

3. ユーザー分離（RLS）
- ユーザーAのデータをユーザーBが見られない
- ユーザーBがAデータを更新/削除できない

4. 回帰
- 原価計算（原価合計/粗利/原価率）が崩れない
- 材料削除時のレシピ整合が維持される
- PC/SPの既存UIが破綻しない

---

## F. リスクとハマりポイント（初心者向け）

- RLSをONにすると突然保存/取得できなくなる  
  - 原因: policy不足 or `user_id` 未設定
- 環境変数の注意（Vite）
  - `VITE_` プレフィックス必須
  - 変更後は開発サーバ再起動
- `service_role` key はフロントで使わない（危険）
  - フロントは `anon key` のみ
- 既存 `supabase_schema.sql` と現行 `types.ts` は差分がある
  - 一括移行ではなく段階移行が安全
- 画像（`menu.image`）は現状Data URL
  - 将来は Supabase Storage 分離を検討（今回は対象外）

---

## 次に実装する時のタスク一覧
- [ ] `.env.local` に `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` を設定
- [ ] Supabase側に最小テーブル（materials/menus/recipes）を作成
- [ ] RLS有効化とユーザー分離ポリシーを作成
- [ ] 認証UI（メール+パスワード）を追加
- [ ] セッション状態で画面表示を切り替え
- [ ] `useMaterials` をSupabase CRUDへ切替
- [ ] 材料の保存/取得/削除を確認
- [ ] `useMenus` をSupabase CRUDへ切替
- [ ] `useRecipes` をSupabase CRUDへ切替
- [ ] ユーザーA/Bでデータ分離確認（RLS）
- [ ] Dexie併用 or 完全移行の方針決定
