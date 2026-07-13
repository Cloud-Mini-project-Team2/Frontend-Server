/* 취업 지원 서비스 - 공통 상수 & 유틸 (API 응답에 없는 화면 전용 옵션 값) */

// 직무 (job.job_part / members.user_job_part) - 입력 폼 자동완성/필터 옵션용
const POSITIONS = [
  "백엔드 개발자",
  "프론트엔드 개발자",
  "풀스택 개발자",
  "DevOps 엔지니어",
  "데이터 분석가",
];

// 희망/근무 지역
const REGION_OPTIONS = ["서울", "경기", "인천", "부산", "대전", "전국"];

// 경력조건 (job.personal_history / members.user_personal_history)
const CAREER_OPTIONS = ["신입", "경력 1~3년", "경력 3~5년", "경력 5년 이상", "경력무관"];

// 희망 급여 (members.user_pay)
const PAY_OPTIONS = ["3,000만원 미만", "3,000~4,000만원", "4,000~5,000만원", "5,000만원 이상", "협의 가능"];

// 플랫폼(source) 표기 - DB값은 영문(SARAMIN/JOBKOREA), 화면은 한글 표기
const SOURCE_LABELS = { SARAMIN: "사람인", JOBKOREA: "잡코리아" };

// CNAME 제공 서비스로부터 받을 도메인 네임 (서비스 제작 중이라 임시 목데이터).
// 완성되면 API 응답값으로 교체한다.
const MOCK_CNAME_DOMAIN = "example.com";

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2200);
}
