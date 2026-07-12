# 취업 지원 서비스 — Frontend / Nginx 서버

채용 공고 열람, 포트폴리오 작성, 회원 관리를 제공하는 취업 지원 웹 서비스의 프론트엔드 & Nginx 배포 레포지토리입니다.
정적 HTML/CSS/JS로 작성되어 있으며, 이 레포에 포함된 `setup_nginx.sh` 스크립트로 라즈베리파이 위에 Nginx 서버를 구축하고 정적 파일을 배포합니다.

<br> </br>

## 서비스 구성

3-tier 구조(WEB - WAS - DB)로 구축되어 있습니다.

| 계층 | 구성 | 비고 |
|---|---|---|
| WEB | Nginx | 정적 파일 서빙 + `/api/` 리버스 프록시 |
| WAS | FastAPI (Python 기반) | 별도 레포에서 관리 |
| DB | MariaDB | WAS와 연동 |

- 통신 프로토콜: HTTP (포트 80)
- 개발 환경: Raspberry Pi 2B
- 운영체제: Ubuntu 22.04.5
- 사용 언어: Python 3.12 (WAS)
- 도메인 주소: `two.greatsounds.me`

브라우저 → Nginx(WEB) 가 정적 파일(html/css/js)은 직접 서빙하고, `/api/`로 시작하는 요청만 같은 서버의 FastAPI(WAS, `127.0.0.1:8000`)로 프록시합니다. WAS는 MariaDB(DB)와 통신해 데이터를 처리합니다. 프론트와 백엔드가 동일 origin(`two.greatsounds.me`)으로 보이기 때문에 CORS 설정 없이도 httpOnly 쿠키 기반 세션이 정상 동작합니다.

<br> </br>

## 페이지 구성

| 페이지 | 파일 | 설명 |
|---|---|---|
| 회원가입 | `html/signUp.html` | 계정 정보 및 희망 근무 조건 입력 |
| 로그인 | `html/login.html` | 로그인 (httpOnly 쿠키 세션) |
| 채용 공고 | `html/jobPost.html` | 사람인/잡코리아 등에서 크롤링된 채용 공고 목록 및 지원 |
| 포트폴리오 | `html/portfolio.html` | 포트폴리오 작성/수정 |
| 마이페이지 | `html/userInfo.html` | 내 정보 및 지원 현황 관리 |

각 페이지는 동일한 이름의 CSS(`css/*.css`)와 JS(`js/*.js`)를 사용하며, 공통 스타일은 `css/style.css`에 정의되어 있습니다. `js/mock-data.js`는 백엔드 연동 전 데모용 목업 데이터를 제공합니다.

<br> </br>

## 디렉토리 구조

```
.
├── html/                # 페이지별 정적 HTML
│   ├── login.html
│   ├── signUp.html
│   ├── jobPost.html
│   ├── portfolio.html
│   └── userInfo.html
├── css/                 # 페이지별 스타일시트 (style.css는 공통)
├── js/                  # 페이지별 스크립트 (mock-data.js는 공통 목업 데이터)
├── setup_nginx.sh       # Nginx 서버 구축/배포 쉘 스크립트
├── setup_nginx.md       # setup_nginx.sh 상세 사용 설명서
└── README.md
```

`setup_nginx.sh` 실행 시 `html/` 하위 HTML 파일은 URL 경로를 그대로 유지하기 위해 배포 대상 디렉토리(`WEB_ROOT`) 최상위로 평탄화되어 복사되고, `css/`, `js/`는 폴더 구조를 유지한 채 함께 복사됩니다(HTML이 `href="css/..."`, `src="js/..."` 같은 상대경로로 참조하기 때문).

<br> </br>

## Nginx 서버 구축 쉘 스크립트 (`setup_nginx.sh`)

라즈베리파이(Debian 계열 OS)에 Nginx가 설치되어 있지 않아도, 스크립트 한 번 실행으로 아래 과정을 모두 처리합니다.

1. **설정 값 확인** — `SERVER_NAME`, `BACKEND_HOST`, `BACKEND_PORT`, `WEB_ROOT`, `SOURCE_DIR` 값을 출력 (환경변수로 재정의 가능, 기본값은 아래 표 참고)
2. **Nginx 설치 확인 및 설치** — `command -v nginx`로 설치 여부를 확인 후, 없으면 `apt-get update && apt-get install -y nginx` 로 설치 (이미 설치되어 있으면 건너뜀)
3. **정적 파일 복사** — `SOURCE_DIR`의 `html/*.html`을 `WEB_ROOT` 최상위로 평탄화 복사하고, `css`/`js`/`assets`/`images`/`img`/`fonts` 폴더가 있으면 구조를 유지한 채 복사. Nginx 기본 페이지(`index.nginx-debian.html`)는 제거
4. **소유자 및 권한 설정** — `WEB_ROOT`의 소유자를 `www-data:www-data`로, 디렉토리는 `755`, 파일은 `644` 권한으로 설정
5. **Nginx 서버 블록 생성** — `/etc/nginx/sites-available/<SERVER_NAME>.conf`에 정적 파일 서빙 + `/api/` 리버스 프록시 설정을 생성하고, 기본 site(`sites-enabled/default`)를 제거한 뒤 심볼릭 링크로 활성화
6. **설정 검사 및 적용** — `nginx -t`로 문법 검사 후, `ufw`가 활성화되어 있으면 `80/tcp` 허용, `systemctl enable/restart nginx`로 반영

기본값이 지정된 환경변수:

| 변수 | 기본값 | 설명 |
|---|---|---|
| `SERVER_NAME` | `two.greatsounds.me` | Nginx `server_name` (외부 접속 도메인) |
| `BACKEND_HOST` | `127.0.0.1` | FastAPI 백엔드 호스트 |
| `BACKEND_PORT` | `8000` | FastAPI 백엔드 포트 (uvicorn 기본값) |
| `WEB_ROOT` | `/var/www/html` | 정적 파일을 서빙할 디렉토리 |
| `SOURCE_DIR` | 스크립트 실행 시 현재 디렉토리(`pwd`) | 배포할 정적 파일이 있는 위치 |

재실행해도 Nginx를 재설치하거나 설정을 중복 생성하지 않도록 작성되어 있어(idempotent), 정적 파일을 수정한 뒤 다시 배포할 때도 동일한 방식으로 재실행하면 됩니다. 자세한 내부 동작과 트러블슈팅은 [`setup_nginx.md`](./setup_nginx.md)를 참고하세요.

<br> </br>

### 실행 방식

전제 조건: 라즈베리파이가 공유기에 연결되어 있고 `80` 포트가 포트포워딩되어 있으며(외부 접속 주소 `two.greatsounds.me`), FastAPI 백엔드가 같은 라즈베리파이에서 `127.0.0.1:8000`으로 실행 중이거나 실행될 예정이어야 합니다.

```bash
git clone <this-repo-url>
cd Frontend-Server          # html/css/js 파일들이 있는 이 디렉토리에서 실행
chmod +x setup_nginx.sh
sudo ./setup_nginx.sh
```

백엔드 포트 등 기본값을 변경해서 실행하고 싶다면 환경변수로 덮어씁니다.

```bash
sudo BACKEND_PORT=9000 ./setup_nginx.sh
```

정상적으로 끝나면 `http://two.greatsounds.me` (포트포워딩 경유) 로 접속해 페이지가 뜨는지 확인합니다.

<br> </br>

## 개발 워크플로우

1. `main`에서 작업 브랜치 생성: `git checkout -b feature/login-page`
2. 수정 후 커밋 & 푸시
3. PR 생성 → 팀원 리뷰 → `main` 머지
4. 배포 서버에서 `git pull` 후 `sudo ./setup_nginx.sh` 재실행하면 변경 사항 반영

### 브랜치 규칙

- `main`: 항상 동작하는 상태 유지, 직접 푸시 금지
- `feature/*`: 기능 개발
- `fix/*`: 버그 수정

### 커밋 메시지 규칙

```
feat: 로그인 페이지 마크업 추가
fix: 회원가입 폼 유효성 검사 오류 수정
style: 마이페이지 레이아웃 정리
docs: README 수정
```

<br> </br>

## API 연동

- 백엔드 API 명세는 팀 Notion 참고
- 인증: httpOnly 쿠키 기반 세션 — JS에서 토큰을 직접 다루지 않음
- 요청 시 `credentials: 'include'` 필수

```js
fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
```

<br> </br>

## 주의사항

- 현재 HTTP 전용(포트 80) — 실제 서비스 시 HTTPS 전환 검토 필요
- `setup_nginx.sh`는 root 권한(`sudo`)이 필요하며, 실행 전 FastAPI 백엔드가 지정된 포트에서 떠 있는지 확인 필요
