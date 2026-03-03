# ---- 依存パッケージのインストール ----
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ---- ビルド ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ---- 本番用ランタイム ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Cloud Run はデフォルトで 8080 番ポートを期待する
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# 最小権限で実行するための専用ユーザーを作成
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# standalone ビルド成果物をコピー
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static   ./.next/static

USER nextjs

EXPOSE 8080

CMD ["node", "server.js"]
