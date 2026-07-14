#!/usr/bin/bash
#
# check_nginx_log.sh
# -------------------------------------------------------------
# Nginx 서버 로그 확인 스크립트.
# setup_nginx.sh 로 구축한 Nginx(WEB)의 access/error 로그를
# 실시간(tail -f) 또는 최근 N줄로 확인한다.
#
# 사용법:
#   chmod +x check_nginx_log.sh
#   ./check_nginx_log.sh                # access 로그 실시간 확인
#   ./check_nginx_log.sh error          # error 로그 실시간 확인
#   ./check_nginx_log.sh access 100     # access 로그 최근 100줄 출력
#   ./check_nginx_log.sh error 50       # error 로그 최근 50줄 출력
#
# 옵션(환경변수로 조절 가능):
#   LOG_DIR   Nginx 로그 디렉토리 (기본: /var/log/nginx)
#
# 참고: /var/log/nginx 는 보통 root/adm 권한이므로, 읽기 권한이
#       없으면 자동으로 sudo 로 재시도한다.
# -------------------------------------------------------------

set -euo pipefail

LOG_DIR="${LOG_DIR:-/var/log/nginx}"
LOG_TYPE="${1:-access}"
LINES="${2:-}"

if [ "${LOG_TYPE}" != "access" ] && [ "${LOG_TYPE}" != "error" ]; then
    echo "[ERROR] 로그 종류는 access 또는 error 만 지정할 수 있습니다."
    echo "        사용법: $0 [access|error] [줄 수]"
    exit 1
fi

LOG_FILE="${LOG_DIR}/${LOG_TYPE}.log"

if [ ! -e "${LOG_FILE}" ]; then
    echo "[ERROR] 로그 파일을 찾을 수 없습니다: ${LOG_FILE}"
    echo "        Nginx가 설치/실행 중인지, LOG_DIR 경로가 맞는지 확인해주세요."
    exit 1
fi

# 읽기 권한이 없으면 sudo로 재시도
RUN_PREFIX=""
if [ ! -r "${LOG_FILE}" ]; then
    echo "[안내] ${LOG_FILE} 읽기 권한이 없어 sudo로 실행합니다."
    RUN_PREFIX="sudo"
fi

if [ -n "${LINES}" ]; then
    echo "===== ${LOG_FILE} (최근 ${LINES}줄) ====="
    ${RUN_PREFIX} tail -n "${LINES}" "${LOG_FILE}"
else
    echo "===== ${LOG_FILE} (실시간, Ctrl+C로 종료) ====="
    ${RUN_PREFIX} tail -f "${LOG_FILE}"
fi
