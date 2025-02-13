# コピースペース (Copyspace)

**セキュアで приват なメッセージング空間**

## 概要

コピースペースは、エンドツーエンド暗号化とルームの有効期限設定により、高いセキュリティと приват シーを実現したメッセージングアプリケーションです。

**主な特徴:**

*   **エンドツーエンド暗号化:**  メッセージは送信者のブラウザで暗号化され、受信者のブラウザでのみ復号化されます。サーバー上にメッセージの平文が保存されることはありません。
*   **ルーム有効期限:**  ルームには有効期限があり、期限切れ後は自動的に削除されるため、メッセージが永続的に残る心配がありません。
*   **管理者機能:**
    *   ルームの有効期限延長
    *   ルームの削除
    *   JSON形式でのメッセージデータエクスポート
    *   参加ユーザー管理 (リスト表示、削除)
    *   招待状発行機能 (公開招待状、個別招待状)
*   **招待制ルーム:**  公開ルームに加えて、招待コードを知っているユーザーのみが参加できる招待制ルームを作成できます。
*   **ユーザー認証:**  ユーザーID/パスワードによる認証機能を実装 (開発環境でのユーザー登録機能も搭載)。JWT (JSON Web Token) によるセッション管理。
*   **Next.js App Router:**  Next.js 14 App Router をベースに構築。
*   **Prisma ORM:**  データベースアクセスに Prisma ORM を採用。
*   **pino ロギング:**  構造化ロギングライブラリ pino を導入。
*   **テストコード:**  API ルートとコンポーネントのテストコード例を実装 (Jest, React Testing Library)。

**技術スタック:**

*   Next.js 14 (App Router)
*   React
*   TypeScript
*   Tailwind CSS
*   Prisma ORM
*   MariaDB (または MySQL)
*   Jest, React Testing Library (テスト)
*   pino (ロギング)
*   jose (JWT)
*   bcryptjs (パスワードハッシュ化)
*   react-copy-to-clipboard

## 環境構築と実行方法

1.  **リポジトリのクローン:**
    ```bash
    git clone <リポジトリURL>
    cd copyspace
    ```

2.  **環境変数の設定:**
    `.env.local` ファイルをコピーして作成し、以下の環境変数を設定してください。

    ```
    DATABASE_URL="mysql://your_db_user:your_db_password@localhost:3306/copyspace_db?charset=utf8mb4"
    ENCRYPTION_KEY=YOUR_AES_ENCRYPTION_KEY # 32バイトのランダムな文字列
    JWT_SECRET_KEY=YOUR_JWT_SECRET_KEY   # JWT 署名用シークレットキー (強力なランダム文字列)
    NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET # NextAuth シークレット (推奨)
    BASE_URL=http://localhost:3000        # アプリケーションのベース URL (招待メールなどで使用)
    ```

    *   `DATABASE_URL`:  MariaDB データベースの接続情報を設定します。
    *   `ENCRYPTION_KEY`:  AES 暗号化に使用する 32 バイトのランダムな文字列を設定します。
    *   `JWT_SECRET_KEY`:  JWT 署名に使用する強力なランダム文字列を設定します。
    *   `NEXTAUTH_SECRET`:  NextAuth シークレット (推奨)

3.  **MariaDB データベースの準備:**
    MariaDB サーバーを起動し、`.env.local` で設定したデータベース名 (`copyspace_db`) のデータベースとユーザーを作成してください。

4.  **Prisma マイグレーションの実行:**
    ```bash
    npx prisma migrate dev
    ```

5.  **依存関係のインストール:**
    ```bash
    npm install
    ```

6.  **開発サーバーの起動:**
    ```bash
    npm run dev
    ```

    ブラウザで `http://localhost:3000` にアクセスしてください。

## テスト実行方法

```bash
npm test