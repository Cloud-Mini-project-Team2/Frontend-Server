# setup_nginx.sh 사용 설명서

라즈베리파이(Debian 계열 OS)에서 nginx가 설치되어 있지 않은 상태여도, 스크립트 한 번 실행으로
- nginx 설치
- 현재 디렉토리의 정적 파일을 `/var/www/html` 로 배포
- 파일/폴더 권한 및 소유자 설정
- FastAPI 백엔드로의 리버스 프록시 구성

까지 한 번에 처리하는 쉘 스크립트입니다.

<br>

## 전제 조건

- 라즈베리파이가 공유기에 연결되어 있고, 공유기에서 `80` 포트가 이 라즈베리파이로 포트포워딩되어 있음
  - 외부 접속 주소: `two.greatsounds.me` (포트 80)
- FastAPI 백엔드 서버가 같은 라즈베리파이에서 기본값(`127.0.0.1:8000`)으로 실행 중이거나, 실행될 예정임
- 스크립트를 배포할 정적 파일(html/css/js 등)이 있는 디렉토리에서 실행

<br>

## 스크립트가 하는 일

### 1. 설정 값 확인
아래 값들은 스크립트 상단에 기본값으로 정의되어 있으며, 환경변수로 덮어쓸 수 있습니다.

| 변수 | 기본값 | 설명 |
|---|---|---|
| `SERVER_NAME` | `two.greatsounds.me` | nginx `server_name` (외부 접속 도메인) |
| `BACKEND_HOST` | `127.0.0.1` | FastAPI 백엔드 호스트 |
| `BACKEND_PORT` | `8000` | FastAPI 백엔드 포트 (uvicorn 기본값) |
| `WEB_ROOT` | `/var/www/html` | 정적 파일을 서빙할 디렉토리 |
| `SOURCE_DIR` | 스크립트 실행 시 현재 디렉토리(`pwd`) | 복사할 정적 파일이 있는 위치 |

예시로 백엔드 포트를 바꿔서 실행하고 싶다면:

```bash
sudo BACKEND_PORT=9000 ./setup_nginx.sh
```

### 2. nginx 설치 확인 및 설치
`command -v nginx` 로 설치 여부를 확인하고, 없으면 `apt-get update && apt-get install -y nginx` 로 설치합니다.
이미 설치되어 있다면 재설치하지 않고 넘어갑니다. (반복 실행 가능)

### 3. 정적 파일 복사
현재 디렉토리(`SOURCE_DIR`)에서 다음을 `/var/www/html` 로 복사합니다.

- `*.html` 파일 전체 (요구사항의 핵심)
- 페이지들이 참조하는 `*.css`, `*.js` 파일 (예: `style.css`, `mock-data.js`)
- `css/`, `js/`, `assets/`, `images/`, `img/`, `fonts/` 하위 폴더가 존재하면 함께 복사

  > html만 복사하면 `<link rel="stylesheet" href="style.css">` 같은 참조가 깨지므로,
  > 실제로 페이지가 정상 동작하도록 css/js 등 함께 필요한 정적 리소스도 복사하도록 했습니다.

또한 nginx 설치 시 기본으로 생성되는 `index.nginx-debian.html` 은 제거하여 우리 사이트가 바로 보이도록 합니다.

### 4. 소유자 및 권한 설정
```bash
chown -R www-data:www-data /var/www/html
find /var/www/html -type d -exec chmod 755 {} \;
find /var/www/html -type f -exec chmod 644 {} \;
```
- 소유자를 nginx 워커 프로세스 사용자인 `www-data` 로 설정 (Debian/라즈베리파이 OS 기준 nginx 기본 실행 사용자)
- 디렉토리는 `755` (소유자 rwx, 그 외 r-x), 파일은 `644` (소유자 rw-, 그 외 r--) 로 설정하여
  nginx는 읽을 수 있되 불필요한 쓰기 권한은 부여하지 않음

### 5. nginx 서버 블록 생성
`/etc/nginx/sites-available/two.greatsounds.me.conf` 파일을 아래와 같이 생성합니다.

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name two.greatsounds.me;

    root /var/www/html;
    index index.html portfolio.html;

    # .git 등 숨김 파일 노출 차단
    location ~ /\. {
        deny all;
    }

    # /api/ 로 들어오는 요청은 FastAPI 백엔드로 프록시
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 정적 파일 서빙
    location / {
        try_files $uri $uri/ =404;
    }
}
```

**백엔드 연동 핵심 포인트**
- 프론트엔드 JS는 `fetch('/api/...', { credentials: 'include' })` 형태로 같은 origin(`two.greatsounds.me`)에 요청을 보냅니다.
- nginx가 `/api/` 로 시작하는 요청만 FastAPI(`127.0.0.1:8000`)로 그대로 전달(proxy_pass 뒤에 경로를 붙이지 않아 `/api/...` 경로가 그대로 백엔드로 전달됨)하고, 나머지는 정적 파일로 서빙합니다.
- 프론트와 백엔드가 같은 origin으로 보이기 때문에 CORS 설정 없이도 브라우저 요청이 정상 동작하고, httpOnly 쿠키 기반 세션도 별도 설정 없이 그대로 전달됩니다.
- 이후 `sites-enabled/default` 를 제거하고 방금 만든 설정 파일만 `sites-enabled` 에 심볼릭 링크로 활성화하여 충돌을 방지합니다.

### 6. 설정 검사 및 적용
```bash
nginx -t                # 문법 오류 검사
systemctl enable nginx   # 부팅 시 자동 시작
systemctl restart nginx  # 설정 반영
```
`ufw` 방화벽이 활성화되어 있는 경우 `80/tcp` 를 자동으로 허용합니다(포트포워딩이 되어 있어도 로컬 방화벽에 막히면 접속이 안 되므로).

<br>

## 실행 방법

```bash
cd Frontend-Server        # html 파일들이 있는 현재 디렉토리로 이동
chmod +x setup_nginx.sh
sudo ./setup_nginx.sh
```

정상적으로 끝나면 `http://two.greatsounds.me` (포트포워딩 경유) 로 접속해 페이지가 뜨는지 확인합니다.

<br>

## 재실행 / 파일 갱신

정적 파일 내용을 수정한 뒤 다시 배포하고 싶다면, 같은 디렉토리에서 스크립트를 다시 실행하면 됩니다.
nginx 재설치나 설정 파일 재작성 없이 안전하게 반복 실행할 수 있도록 작성되어 있습니다(idempotent).

<br>

## 트러블슈팅

| 증상 | 확인 사항 |
|---|---|
| 브라우저에서 접속이 안 됨 | 공유기 포트포워딩(80 → 라즈베리파이) 설정 확인, `sudo systemctl status nginx` 로 nginx 구동 확인 |
| 정적 파일은 뜨는데 API 요청이 실패함 | FastAPI 서버가 `127.0.0.1:8000` 에서 실행 중인지 확인 (`curl http://127.0.0.1:8000` 등), `BACKEND_PORT` 를 다르게 실행했다면 스크립트 실행 시 환경변수로 지정 |
| `nginx -t` 실패 | 출력된 에러 메시지의 파일/라인 확인 후 `/etc/nginx/sites-available/two.greatsounds.me.conf` 직접 점검 |
| 403 Forbidden | `/var/www/html` 및 상위 디렉토리(`/var/www`)에 대해 `www-data` 가 읽기/실행 권한을 가지고 있는지 확인 |
