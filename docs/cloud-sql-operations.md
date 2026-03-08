# Cloud SQL 運用ガイド

## インスタンス情報

| 項目 | 値 |
|---|---|
| インスタンス名 | `gcp-tutorial-db-dev` |
| リージョン | `asia-northeast2` |
| ティア | `db-f1-micro` |
| データベース | `app` |
| ユーザー | `app` |

## インスタンスの停止

開発しない時間帯はインスタンスを停止することで **月額 ~$7.67 を節約** できます。

```bash
gcloud sql instances patch gcp-tutorial-db-dev \
  --activation-policy=NEVER \
  --project=gcp-tutorial-488405
```

## インスタンスの起動

```bash
gcloud sql instances patch gcp-tutorial-db-dev \
  --activation-policy=ALWAYS \
  --project=gcp-tutorial-488405
```

## 状態の確認

```bash
gcloud sql instances describe gcp-tutorial-db-dev \
  --project=gcp-tutorial-488405 \
  --format="value(settings.activationPolicy,state)"
```

- `ALWAYS / RUNNABLE` → 起動中（課金あり）
- `NEVER / SUSPENDED` → 停止中（課金なし）

## 注意事項

- 停止中はアプリのDB接続が失敗します（Cloud Run、ローカル開発ともに）
- 停止中もストレージ料金（~$1.70/月）は発生します
- 起動には **1〜2分** かかります
- Terraform apply 時はインスタンスが起動している必要があります
