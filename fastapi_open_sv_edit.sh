#!/usr/bin/bash
#
# fastapi_open_sv.sh
# -------------------------------------------------------------
# Ubuntu 24.04 환경에서 Python만 설치되어 있다는 가정 하에
# FastAPI 서버를 한번에 세팅하고, 이 저장소의 정적 파일
# (html/css/js)까지 그대로 서빙해서 웹 페이지를 띄우는 스크립트.
#
# nginx 없이도 FastAPI 단독으로 브라우저에서 바로 확인할 수 있도록,
# setup_nginx.sh 가 배포 시 하는 것과 동일한 방식으로 페이지를 서빙한다.
#   - html/*.html  -> 파일명 그대로 루트 경로에서 서빙 (예: /login.html)
#   - css/, js/    -> 폴더 구조를 유지한 채 마운트 (/css, /js)
#   - "/"          -> portfolio.html (nginx의 index 설정과 동일)
#
# 사용법 (반드시 html/css/js가 있는 저장소 루트에서 실행):
#   chmod +x fastapi_open_sv_edit.sh
#   ./fastapi_open_sv_edit.sh
#
# 옵션(환경변수로 조절 가능):
#   APP_DIR     서버 런타임 디렉토리, venv/main.py가 생성되는 곳 (기본: ./fastapi_app)
#   SOURCE_DIR  html/css/js 가 있는 정적 파일 디렉토리 (기본: 현재 디렉토리)
#   HOST        바인딩 호스트 (기본: 127.0.0.1)
#   PORT        바인딩 포트 (기본: 8000)
#   RELOAD      자동 리로드 여부 true/false (기본: true)
#
# 서버는 nohup으로 백그라운드 실행되며, 아래 위치에 로그/PID가 남는다.
#   로그 : ${APP_DIR}/uvicorn.log
#   PID  : ${APP_DIR}/uvicorn.pid
#
# 종료 방법:
#   kill "$(cat ${APP_DIR}/uvicorn.pid)"
#
# 예)
#   PORT=9000 ./fastapi_open_sv_edit.sh
#
# 주의 (nginx 연동):
#   setup_nginx.sh 로 실제 배포할 때는 "/api/" 로 들어온 요청만 경로를 그대로
#   유지한 채 http://BACKEND_HOST:BACKEND_PORT 로 프록시한다. 즉 백엔드 API
#   라우트는 반드시 "/api" 로 시작해야 하며, 이 스크립트의 HOST/PORT 값은
#   setup_nginx.sh 의 BACKEND_HOST/BACKEND_PORT 값과 일치해야 한다
#   (기본값끼리는 이미 127.0.0.1:8000 으로 일치). html/css/js 서빙은 이
#   스크립트로 로컬에서 미리 확인하기 위한 용도이며, 실제 배포된 환경에서는
#   nginx가 정적 파일을 담당한다.
# -------------------------------------------------------------

set -euo pipefail

# ---------- 설정값 ----------
APP_DIR="${APP_DIR:-./fastapi_app}"
SOURCE_DIR="${SOURCE_DIR:-$(pwd)}"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8000}"
RELOAD="${RELOAD:-true}"
VENV_DIR="${APP_DIR}/venv"

echo "=================================================="
echo " FastAPI 서버 세팅 시작"
echo " APP_DIR    : ${APP_DIR}"
echo " SOURCE_DIR : ${SOURCE_DIR}"
echo " HOST       : ${HOST}"
echo " PORT       : ${PORT}"
echo " RELOAD     : ${RELOAD}"
echo "=================================================="

# ---------- 0. 정적 파일(html/css/js) 존재 확인 ----------
if [ ! -d "${SOURCE_DIR}/html" ] || [ ! -d "${SOURCE_DIR}/css" ] || [ ! -d "${SOURCE_DIR}/js" ]; then
    echo "[ERROR] ${SOURCE_DIR} 에서 html/, css/, js/ 디렉토리를 찾을 수 없습니다."
    echo "        이 스크립트는 Frontend-Server 저장소 루트에서 실행해야 합니다."
    echo "        (다른 위치의 정적 파일을 쓰려면 SOURCE_DIR 환경변수로 지정)"
    exit 1
fi

# ---------- 1. 필수 패키지 설치 (apt) ----------
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 명령어를 찾을 수 없습니다. 먼저 python3를 설치해주세요."
    exit 1
fi

echo "[1/5] 시스템 패키지 업데이트 및 필수 도구 설치 확인 중..."
NEED_APT_INSTALL=false
for pkg in python3-venv python3-pip; do
    if ! dpkg -s "$pkg" &> /dev/null; then
        NEED_APT_INSTALL=true
    fi
done

if [ "$NEED_APT_INSTALL" = true ]; then
    echo "  -> python3-venv / python3-pip 설치가 필요합니다. sudo 권한이 필요할 수 있습니다."
    sudo apt-get update -y
    sudo apt-get install -y python3-venv python3-pip
else
    echo "  -> 필수 도구가 이미 설치되어 있습니다."
fi

# ---------- 2. 프로젝트 디렉토리 생성 ----------
echo "[2/5] 프로젝트 디렉토리 준비 중: ${APP_DIR}"
mkdir -p "${APP_DIR}"

# ---------- 3. 가상환경(venv) 생성 ----------
if [ ! -d "${VENV_DIR}" ]; then
    echo "[3/5] 가상환경 생성 중: ${VENV_DIR}"
    python3 -m venv "${VENV_DIR}"
else
    echo "[3/5] 가상환경이 이미 존재합니다. 재사용합니다: ${VENV_DIR}"
fi

# shellcheck disable=SC1091
source "${VENV_DIR}/bin/activate"

# ---------- 4. FastAPI / Uvicorn 설치 ----------
echo "[4/5] pip 업그레이드 및 FastAPI, Uvicorn 설치 중..."
pip install --upgrade pip --quiet
pip install --quiet "fastapi" "uvicorn[standard]"

# ---------- 5. main.py 생성 (없을 경우에만) ----------
MAIN_PY="${APP_DIR}/main.py"
if [ ! -f "${MAIN_PY}" ]; then
    echo "[5/5] main.py 생성 중: ${MAIN_PY}"
    cat > "${MAIN_PY}" <<EOF
from pathlib import Path

from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# ${SOURCE_DIR} 의 정적 파일(html/css/js)을 그대로 서빙한다.
# setup_nginx.sh 로 배포할 때와 동일한 URL 구조를 FastAPI 단독으로 재현한다.
PROJECT_ROOT = Path("${SOURCE_DIR}")
HTML_DIR = PROJECT_ROOT / "html"
CSS_DIR = PROJECT_ROOT / "css"
JS_DIR = PROJECT_ROOT / "js"

app = FastAPI()

# setup_nginx.sh 는 "/api/" 로 시작하는 요청만 이 서버로 프록시하며,
# 경로를 바꾸지 않고 그대로 전달한다. 따라서 백엔드 API 라우트는
# 반드시 "/api" 로 시작해야 실제 배포 환경(nginx)에서도 동일하게 동작한다.
router = APIRouter(prefix="/api")


@router.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(router)

# css/js는 폴더 구조를 유지한 채 마운트한다.
# (html에서 href="css/x.css", src="js/x.js" 처럼 상대경로로 참조하기 때문)
app.mount("/css", StaticFiles(directory=CSS_DIR), name="css")
app.mount("/js", StaticFiles(directory=JS_DIR), name="js")


@app.get("/")
def index():
    # nginx의 "index index.html portfolio.html;" 설정과 동일하게
    # 기본 진입 페이지는 portfolio.html로 맞춘다.
    return FileResponse(HTML_DIR / "portfolio.html")


@app.get("/{page_name}.html")
def serve_page(page_name: str):
    html_path = HTML_DIR / f"{page_name}.html"
    if not html_path.is_file():
        raise HTTPException(status_code=404, detail="Not Found")
    return FileResponse(html_path)
EOF
else
    echo "[5/5] 기존 main.py 파일을 사용합니다: ${MAIN_PY}"
fi

# ---------- 방화벽(ufw) 포트 오픈 (설치되어 있는 경우만) ----------
if command -v ufw &> /dev/null; then
    if sudo ufw status | grep -q "active"; then
        echo "[방화벽] ufw가 활성화되어 있어 포트 ${PORT}를 허용합니다."
        sudo ufw allow "${PORT}/tcp" || true
    fi
fi

# ---------- 서버 실행 (백그라운드) ----------
RELOAD_FLAG=""
if [ "${RELOAD}" = "true" ]; then
    RELOAD_FLAG="--reload"
fi

cd "${APP_DIR}"

PID_FILE="uvicorn.pid"
LOG_FILE="uvicorn.log"

# 이미 실행 중이면 중복 실행하지 않음
if [ -f "${PID_FILE}" ] && kill -0 "$(cat "${PID_FILE}")" 2>/dev/null; then
    echo "[안내] 이미 실행 중입니다 (PID: $(cat "${PID_FILE}")). 종료하려면:"
    echo "       kill $(cat "${PID_FILE}")"
    exit 0
fi

nohup uvicorn main:app --host "${HOST}" --port "${PORT}" ${RELOAD_FLAG} \
    > "${LOG_FILE}" 2>&1 &
echo $! > "${PID_FILE}"
disown

echo "=================================================="
echo " 서버가 백그라운드로 실행되었습니다: http://${HOST}:${PORT}"
echo " PID  : $(cat "${PID_FILE}") (${APP_DIR}/${PID_FILE})"
echo " LOG  : ${APP_DIR}/${LOG_FILE}"
echo " 종료 : kill \$(cat ${APP_DIR}/${PID_FILE})"
echo "=================================================="
