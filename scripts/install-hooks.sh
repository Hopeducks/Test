#!/usr/bin/env bash
# 이 스크립트를 실행하면 보안 pre-commit 훅이 설치됩니다.
# 저장소를 clone한 후 `bash scripts/install-hooks.sh` 를 실행하세요.
set -e

HOOK_SRC="scripts/pre-commit.hook"
HOOK_DEST=".git/hooks/pre-commit"

if [ ! -d ".git" ]; then
  echo "❌ git 저장소 루트에서 실행해야 합니다."
  exit 1
fi

cp "$HOOK_SRC" "$HOOK_DEST"
chmod +x "$HOOK_DEST"
echo "✅ pre-commit 보안 훅이 설치되었습니다: $HOOK_DEST"
