#!/usr/bin/env bash
#
# setup_nginx.sh
# 라즈베리파이(Debian 계열)에서 nginx를 설치/설정하고,
# 현재 디렉토리의 정적 파일을 /var/www/html 로 배포한 뒤
# FastAPI 백엔드로의 리버스 프록시까지 구성하는 스크립트.
#
# 사용법:
#   sudo ./setup_nginx.sh
#
# 환경변수로 값 재정의 가능 (기본값은 요구사항 기준):
#   SERVER_NAME   (기본: two.greatsounds.me)
#   BACKEND_HOST  (기본: 127.0.0.1)
#   BACKEND_PORT  (기본: 8000)
#   WEB_ROOT      (기본: /var/www/html)
#   SOURCE_DIR    (기본: 스크립트를 실행한 현재 디렉토리)

set -euo pipefail

# ------------------------------------------------------------------
# 0. 설정 값
# ------------------------------------------------------------------
SERVER_NAME="${SERVER_NAME:-two.greatsounds.me}"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
WEB_ROOT="${WEB_ROOT:-/var/www/html}"
SOURCE_DIR="${SOURCE_DIR:-$(pwd)}"
NGINX_CONF_PATH="/etc/nginx/sites-available/${SERVER_NAME}.conf"
NGINX_ENABLED_PATH="/etc/nginx/sites-enabled/${SERVER_NAME}.conf"

# ------------------------------------------------------------------
# 1. root 권한 확인
# ------------------------------------------------------------------
if [ "$(id -u)" -ne 0 ]; then
  echo "[ERROR] 이 스크립트는 root 권한이 필요합니다. 'sudo ./setup_nginx.sh' 로 실행하세요." >&2
  exit 1
fi

echo "[1/6] 설정 값 확인"
echo "  - SERVER_NAME : ${SERVER_NAME}"
echo "  - BACKEND     : http://${BACKEND_HOST}:${BACKEND_PORT}"
echo "  - WEB_ROOT    : ${WEB_ROOT}"
echo "  - SOURCE_DIR  : ${SOURCE_DIR}"

# ------------------------------------------------------------------
# 2. nginx 설치 (미설치 환경 대응)
# ------------------------------------------------------------------
echo "[2/6] nginx 설치 확인"
if ! command -v nginx >/dev/null 2>&1; then
  echo "  nginx 가 설치되어 있지 않아 설치를 진행합니다."
  apt-get update
  apt-get install -y nginx
else
  echo "  nginx 가 이미 설치되어 있습니다."
fi

# ------------------------------------------------------------------
# 3. 정적 파일 복사
# ------------------------------------------------------------------
echo "[3/6] 정적 파일 복사 (${SOURCE_DIR} -> ${WEB_ROOT})"
mkdir -p "$WEB_ROOT"

# 기존 nginx 기본 페이지 제거
rm -f "$WEB_ROOT"/index.nginx-debian.html

# html/ 폴더의 html 파일들은 URL 경로(/login.html 등)를 그대로 유지하기 위해
# WEB_ROOT 최상위로 평탄화하여 복사
find "${SOURCE_DIR}/html" -maxdepth 1 -type f -name "*.html" -exec cp -v {} "$WEB_ROOT"/ \;

# css/js/assets 등 하위 폴더는 그대로 하위 폴더 구조를 유지하며 복사
# (html 파일이 href="css/x.css", src="js/x.js" 처럼 상대경로로 참조)
for dir in css js assets images img fonts; do
  if [ -d "${SOURCE_DIR:?}/${dir}" ]; then
    cp -rv "${SOURCE_DIR}/${dir}" "$WEB_ROOT"/
  fi
done

# ------------------------------------------------------------------
# 4. 소유자 및 권한 설정
# ------------------------------------------------------------------
echo "[4/6] 소유자 및 권한 설정 (${WEB_ROOT})"
chown -R www-data:www-data "$WEB_ROOT"
find "$WEB_ROOT" -type d -exec chmod 755 {} \;
find "$WEB_ROOT" -type f -exec chmod 644 {} \;

# ------------------------------------------------------------------
# 5. nginx 서버 블록 설정 (정적 파일 + FastAPI 리버스 프록시)
# ------------------------------------------------------------------
echo "[5/6] nginx 설정 파일 생성 (${NGINX_CONF_PATH})"
cat > "$NGINX_CONF_PATH" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${SERVER_NAME};

    root ${WEB_ROOT};
    index index.html portfolio.html;

    # .git 등 숨김 파일 노출 차단
    location ~ /\. {
        deny all;
    }

    # /api/ 로 들어오는 요청은 FastAPI 백엔드로 프록시
    location /api/ {
        proxy_pass http://${BACKEND_HOST}:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # 정적 파일 서빙
    location / {
        try_files \$uri \$uri/ =404;
    }
}
EOF

# 기본 site 비활성화 (충돌 방지) 후 새 설정 활성화
rm -f /etc/nginx/sites-enabled/default
ln -sf "$NGINX_CONF_PATH" "$NGINX_ENABLED_PATH"

# ------------------------------------------------------------------
# 6. 설정 검사 및 nginx 반영
# ------------------------------------------------------------------
echo "[6/6] nginx 설정 검사 및 적용"
nginx -t

# 방화벽(ufw)이 활성화된 경우 80 포트 허용
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow 80/tcp
fi

systemctl enable nginx
systemctl restart nginx

echo ""
echo "완료되었습니다. http://${SERVER_NAME} 로 접속해 확인하세요."
