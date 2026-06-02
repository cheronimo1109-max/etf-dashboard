#!/bin/bash
# 自動コミット＆プッシュ — ファイル保存を検知して GitHub に自動反映

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "👀 監視開始: $DIR"
echo "   src/ api/ index.html の変更を検知したら自動プッシュします"
echo "   終了: Ctrl+C"
echo ""

TIMER=""

fswatch -o --exclude='node_modules' --exclude='.git' --exclude='dist' \
  src/ api/ public/ index.html vite.config.js vercel.json \
| while read -r CHANGES; do

  # タイマーをリセット（連続保存をまとめる）
  kill "$TIMER" 2>/dev/null

  (
    sleep 5
    cd "$DIR"

    if [ -n "$(git status --porcelain)" ]; then
      TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
      git add .
      git commit -m "auto: $TIMESTAMP"
      git push && echo "✅ プッシュ完了 ($TIMESTAMP)" || echo "❌ プッシュ失敗"
    fi
  ) &

  TIMER=$!
done
