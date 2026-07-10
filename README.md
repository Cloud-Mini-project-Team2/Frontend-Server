# 포트폴리오 관리 시스템 — Frontend

포트폴리오 관리 웹사이트의 프론트엔드 레포지토리입니다.
정적 HTML/CSS/JS로 구성되며, 각자 로컬에 구축한 Nginx 서버로 서빙합니다.

<br> </br>

## 기술 스택

- HTML / CSS / JavaScript (Vanilla)
- Nginx (정적 파일 서빙 + FastAPI 리버스 프록시)
- Backend: FastAPI (별도 레포) / DB: MariaDB

<br> </br>


## 페이지 구성

| 페이지 | 파일 | 설명 |
|---|---|---|
| 회원가입 | `signup.html` | 계정 생성 |
| 로그인 | `login.html` | 로그인 (httpOnly 쿠키 세션) |
| 추가 정보 입력 | `additional-info.html` | 희망 직무 등 추가 정보 |
| 채용 공고 | `jobs.html` | 크롤링된 채용 공고 목록 |
| 포트폴리오 편집 | `portfolio-edit.html` | 포트폴리오 작성/수정 |
| 마이페이지 | `mypage.html` | 내 정보 및 포트폴리오 관리 |

> 파일명은 실제 구현에 맞게 수정하세요.

<br> </br>

## 디렉토리 구조

```
.
├── index.html
├── css/
├── js/
├── assets/        # 이미지, 폰트 등
└── nginx/
    └── default.conf   # Nginx 설정 예시
```

<br> </br>

## 로컬 개발 환경 구축

### 1. 레포지토리 클론

```bash
git clone https://github.com/<org>/<frontend-repo>.git
cd <frontend-repo>
```

<br> </br>

### 2. Nginx 설치 및 설정

```bash
sudo apt update && sudo apt install nginx
```

`/etc/nginx/sites-available/default` 의 root를 클론한 폴더로 지정:

```nginx
server {
    listen 80;
    server_name _;

    root /home/<user>/<frontend-repo>;
    index index.html;

    # .git 폴더 노출 차단
    location ~ /\.git { deny all; }

    # API 요청은 FastAPI로 프록시
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
<br> </br>

### 3. 적용

```bash
sudo nginx -t          # 설정 문법 검사
sudo systemctl reload nginx
```

브라우저에서 `http://localhost` 접속 확인.

<br> </br>

## 개발 워크플로우

1. `main`에서 작업 브랜치 생성: `git checkout -b feature/login-page`
2. 수정 후 커밋 & 푸시
3. PR 생성 → 팀원 리뷰 → `main` 머지
4. 각자 서버에서 `git pull` 하면 반영 (정적 파일이라 Nginx 재시작 불필요)

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
- 포트폴리오 CNAME 서브도메인은 파트너 팀 서비스가 담당 (이름과 URL만 전달)
