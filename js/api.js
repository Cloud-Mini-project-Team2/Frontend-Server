/* 백엔드(FastAPI) 연동 공통 유틸.
   배포 환경(nginx)에서 프론트와 백엔드가 같은 origin(/api/...)으로 보이므로
   상대 경로 + credentials: "include" 로 호출한다. */

const API_BASE = "/api";

async function apiRequest(path, { method = "GET", body, isFormData = false } = {}) {
  const options = { method, credentials: "include" };

  if (body !== undefined) {
    if (isFormData) {
      options.body = body;
    } else {
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(body);
    }
  }

  const res = await fetch(`${API_BASE}${path}`, options);

  let payload = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    payload = await res.json();
  }

  if (!res.ok) {
    const detail = payload && payload.detail;
    const error = new Error((detail && detail.message) || "요청 처리 중 오류가 발생했습니다.");
    error.code = detail && detail.code;
    error.status = res.status;
    throw error;
  }

  return payload ? payload.data : null;
}

// 채용 공고 크롤링 실행 트리거. 크롤러 자체는 백엔드(WAS)에 구현되어 있고
// 여기서는 실행 요청만 보낸다. keepalive: 로그인 직후처럼 페이지 이동이
// 이어지는 상황에서도 요청이 취소되지 않도록 한다. 크롤링은 부가 동작이므로
// 실패해도 화면 흐름을 막지 않는다.
function runCrawler() {
  return fetch(`${API_BASE}/jobs/crawl`, {
    method: "POST",
    credentials: "include",
    keepalive: true,
  }).catch((err) => {
    console.warn("크롤링 실행 요청 실패:", err);
  });
}

// 로그인 필요 페이지 진입 시 세션 확인. 미인증이면 로그인 페이지로 보내고 null 반환.
async function requireLogin() {
  try {
    return await apiRequest("/users/me");
  } catch (err) {
    window.location.href = "login.html";
    return null;
  }
}
