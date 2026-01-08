#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="/opt/homebrew/var/www/ai_health/dist"
SUDO="${SUDO:-}"

npm run build

if [[ -n "${SUDO}" ]]; then
  ${SUDO} mkdir -p "${TARGET_DIR}"
  ${SUDO} rm -rf "${TARGET_DIR:?}/"*
  ${SUDO} cp -R dist/* "${TARGET_DIR}/"
else
  mkdir -p "${TARGET_DIR}"
  rm -rf "${TARGET_DIR:?}/"*
  cp -R dist/* "${TARGET_DIR}/"
fi

if command -v brew >/dev/null 2>&1; then
  ${SUDO} brew services restart nginx || true
else
  ${SUDO} nginx -s reload || true
fi

echo "部署完成: ${TARGET_DIR}"
echo "ngrok 启动命令: ngrok http 8080"
