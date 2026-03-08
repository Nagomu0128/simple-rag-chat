# GCP インフラ構築手順書

本手順書は、このプロジェクトのGCPインフラをゼロから構築する際の完全な手順をまとめたものです。
各ステップに **[GUI]** **[CLI]** **[Terraform]** **[手動]** のラベルを付けて、操作方法を明示しています。

---

## 前提条件

- Google アカウントを持っていること
- クレジットカード or 請求先アカウントが設定済みであること
- ローカルに以下がインストール済みであること:
  - `gcloud` CLI
  - `terraform` (>= 1.5)
  - `git`
  - `docker` (ローカルテスト用、任意)

---

## Phase 1: GCP プロジェクトの作成と初期設定

### 1-1. GCP プロジェクト作成 [GUI]

> Terraform ではプロジェクト作成に組織権限が必要なため、GUI で行うのが簡単です。

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 上部のプロジェクト選択メニュー → 「新しいプロジェクト」
3. プロジェクト名を入力（例: `gcp-tutorial`）
4. 「作成」をクリック
5. 作成後、**プロジェクトID** と **プロジェクト番号** をメモする
   - プロジェクト番号はダッシュボードの「プロジェクト情報」カードで確認可能

### 1-2. 請求先アカウントの紐づけ [GUI]

1. Cloud Console → 「お支払い」
2. 作成したプロジェクトに請求先アカウントをリンク

> 請求先アカウントが紐づいていないと API の有効化やリソース作成ができません。

### 1-3. gcloud CLI の認証・初期設定 [CLI]

```bash
# Google アカウントでログイン
gcloud auth login

# Application Default Credentials の設定 (Terraform が使用)
gcloud auth application-default login

# デフォルトプロジェクトを設定
gcloud config set project <YOUR_PROJECT_ID>
```

---

## Phase 2: GitHub リポジトリとの接続 (Cloud Build)

> Cloud Build の GitHub 接続 (Gen 2) は OAuth 認証フローが必要なため、**GUI での操作が必須**です。
> Terraform の `google_cloudbuildv2_connection` リソースでも作成可能ですが、
> GitHub App のインストールと OAuth 認証は GUI 操作が避けられません。

### 2-1. Cloud Build と GitHub の接続 [GUI]

1. Cloud Console → 「Cloud Build」→「リポジトリ」(第2世代)
2. 「ホスト接続を作成」をクリック
3. プロバイダ: **GitHub** を選択
4. リージョン: **asia-northeast2** を選択
5. 接続名: **gcp-tutorial** と入力
6. 「接続」をクリック → GitHub の OAuth 認証フローに遷移
7. GitHub で認証し、対象リポジトリへのアクセスを許可
8. Cloud Console に戻り、接続が「COMPLETE」になることを確認

### 2-2. リポジトリのリンク [GUI]

1. 作成した接続の中で「リポジトリをリンク」
2. 対象リポジトリ（例: `Nagomu0128/gcp-tutorial`）を選択
3. リンクを作成

> この操作により以下が自動作成されます:
> - Secret Manager に OAuth トークン用のシークレット
> - Cloud Build 接続リソース
>
> リンク後のリポジトリリソース名は以下の形式になります（Terraform で使用）:
> ```
> projects/<PROJECT_ID>/locations/asia-northeast2/connections/gcp-tutorial/repositories/<GITHUB_USER>-<REPO_NAME>
> ```

---

## Phase 3: Terraform の準備

### 3-1. ディレクトリ構成の確認 [手動]

```
terraform/
├── environments/
│   └── dev/
│       ├── main.tf          # ルートモジュール（プロバイダ、API有効化、モジュール呼び出し）
│       ├── variables.tf     # 入力変数定義
│       ├── outputs.tf       # 出力定義
│       └── terraform.tfvars # 変数の値（※要作成・Git管理外）
└── modules/
    ├── artifact_registry/   # Docker リポジトリ
    ├── cloud_build/         # ビルドトリガー
    ├── cloud_run/           # Cloud Run サービス
    ├── cloud_sql/           # PostgreSQL インスタンス
    ├── cloud_storage/       # GCS バケット
    ├── iam/                 # サービスアカウントと権限
    └── secret_manager/      # シークレット管理
```

### 3-2. terraform.tfvars の作成 [手動]

`terraform/environments/dev/terraform.tfvars` を作成します。
**このファイルには機密情報が含まれるため `.gitignore` に追加してください。**

```hcl
project_id     = "<YOUR_PROJECT_ID>"       # 例: gcp-tutorial-488405
project_number = "<YOUR_PROJECT_NUMBER>"   # 例: 373484600250
db_password    = "<STRONG_PASSWORD>"       # Cloud SQL ユーザーのパスワード
```

確認方法:
```bash
# プロジェクトID
gcloud config get-value project

# プロジェクト番号
gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)'
```

### 3-3. .gitignore への追加 [手動]

```
# Terraform
*.tfvars
*.tfstate
*.tfstate.backup
.terraform/
.terraform.lock.hcl
```

---

## Phase 4: Terraform の実行

### 4-1. 初期化 [CLI]

```bash
cd terraform/environments/dev
terraform init
```

### 4-2. 実行計画の確認 [CLI]

```bash
terraform plan
```

> ここで作成されるリソースの一覧を確認してください。
> 以下のリソースが作成予定として表示されるはずです:
>
> | リソース | 説明 |
> |---------|------|
> | `google_project_service.apis` (6個) | API の有効化 |
> | `google_service_account.cloud_run` | Cloud Run 用 SA |
> | `google_project_iam_member` (5個) | IAM バインディング |
> | `google_service_account_iam_member` | SA 間の権限 |
> | `google_secret_manager_secret` | DB パスワード用シークレット |
> | `google_secret_manager_secret_version` | シークレットの値 |
> | `google_artifact_registry_repository` | Docker リポジトリ |
> | `google_sql_database_instance` | PostgreSQL インスタンス |
> | `google_sql_database` | データベース |
> | `google_sql_user` | DB ユーザー |
> | `google_cloud_run_v2_service` | Cloud Run サービス |
> | `google_cloud_run_v2_service_iam_member` | 未認証アクセス許可 |
> | `google_cloudbuild_trigger` | ビルドトリガー |
> | `google_storage_bucket` | GCS バケット |

### 4-3. 適用 [CLI]

```bash
terraform apply
```

> `yes` を入力して適用します。
>
> **所要時間の目安:**
> - API 有効化: 数十秒〜数分
> - Cloud SQL インスタンス: **10〜15分**（最も時間がかかる）
> - その他: 数十秒〜数分

### 4-4. 適用後の確認 [CLI]

```bash
# 出力値の確認
terraform output

# 各リソースの確認
gcloud run services list
gcloud sql instances list
gcloud artifacts repositories list
gcloud storage buckets list
gcloud secrets list
gcloud iam service-accounts list
gcloud builds triggers list --region=asia-northeast2
```

---

## Phase 5: 適用後の手動確認・調整

### 5-1. Cloud Run の動作確認 [CLI / ブラウザ]

```bash
# Terraform output から URL を取得
terraform output cloud_run_url

# curl でアクセス確認
curl $(terraform output -raw cloud_run_url)
```

> 初回は Terraform がデフォルトイメージ (`us-docker.pkg.dev/cloudrun/container/hello`) で
> デプロイするため、Hello World ページが表示されます。

### 5-2. Cloud Build トリガーの動作確認 [GUI / CLI]

```bash
# 手動でトリガーを実行してテスト
gcloud builds triggers run gcp-tutorial-deploy-dev \
  --region=asia-northeast2 \
  --branch=main
```

または Cloud Console → Cloud Build → トリガー → 「実行」

### 5-3. Cloud SQL への接続確認 (任意) [CLI]

```bash
# Cloud SQL Auth Proxy 経由で接続する場合
gcloud sql connect gcp-tutorial-db-dev --user=app --database=app
```

---

## Phase 6: Terraform State のリモート管理 (推奨)

> ローカルの state ファイルは紛失リスクがあるため、GCS に保存することを推奨します。

### 6-1. State 用バケットの作成 [CLI]

```bash
# Terraform 管理外で手動作成（鶏と卵の問題を回避）
gcloud storage buckets create gs://<PROJECT_ID>-terraform-state \
  --location=asia-northeast2 \
  --uniform-bucket-level-access
```

### 6-2. backend 設定の有効化 [手動]

`terraform/environments/dev/main.tf` の backend ブロックのコメントを外す:

```hcl
terraform {
  backend "gcs" {
    bucket = "<PROJECT_ID>-terraform-state"
    prefix = "env/dev"
  }
}
```

### 6-3. State の移行 [CLI]

```bash
terraform init -migrate-state
```

> 「ローカルの state をリモートに移行しますか？」と聞かれるので `yes` を入力。

---

## 操作区分のまとめ

| ステップ | 操作方法 | 理由 |
|---------|---------|------|
| プロジェクト作成 | **GUI** | 組織権限不要で簡単 |
| 請求先アカウント紐づけ | **GUI** | コンソールのみ |
| gcloud 認証 | **CLI** | `gcloud auth login` |
| GitHub 接続 (Cloud Build) | **GUI** | OAuth 認証フローが必要 |
| リポジトリリンク | **GUI** | 接続作成の続き |
| terraform.tfvars 作成 | **手動** (エディタ) | 機密情報の入力 |
| API 有効化 | **Terraform** | `google_project_service` |
| IAM / SA | **Terraform** | `google_service_account`, `google_project_iam_member` |
| Secret Manager | **Terraform** | `google_secret_manager_secret` |
| Artifact Registry | **Terraform** | `google_artifact_registry_repository` |
| Cloud SQL | **Terraform** | `google_sql_database_instance` |
| Cloud Run | **Terraform** | `google_cloud_run_v2_service` |
| Cloud Build トリガー | **Terraform** | `google_cloudbuild_trigger` |
| Cloud Storage | **Terraform** | `google_storage_bucket` |
| State バケット作成 | **CLI** | Terraform 管理外で先に作成 |
| State 移行 | **CLI** | `terraform init -migrate-state` |

---

## 補足: 既存リソースがある場合の import

既に手動やCLIで作成済みのリソースがある場合、`terraform import` で取り込みます。

```bash
# Artifact Registry
terraform import 'module.artifact_registry.google_artifact_registry_repository.docker' \
  projects/<PROJECT_ID>/locations/asia-northeast2/repositories/gcp-tutorial

# Cloud Run
terraform import 'module.cloud_run.google_cloud_run_v2_service.this' \
  projects/<PROJECT_ID>/locations/asia-northeast2/services/gcp-tutorial-service
```

import 後に `terraform plan` で差分を確認し、Terraform 定義と実態を合わせてください。

---

## トラブルシューティング

| 問題 | 原因 | 対処 |
|------|------|------|
| `API not enabled` エラー | API 有効化の伝播待ち | 数分待ってリトライ、または `depends_on` を確認 |
| Cloud SQL 作成が失敗 | 同名インスタンスの削除直後 | 削除後 1週間は同名で作成不可。別名を使用 |
| Cloud Build トリガー作成失敗 | GitHub 接続が未完了 | Phase 2 を再確認 |
| `terraform apply` で権限エラー | ADC の認証切れ | `gcloud auth application-default login` を再実行 |
| Secret Manager アクセス拒否 | Cloud Run SA に権限がない | IAM モジュールの `secretmanager.secretAccessor` を確認 |
