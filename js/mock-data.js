/* 취업 지원 서비스 - 공통 목업 데이터 (백엔드 연동 전 프론트 데모용)
   2026/07/10 스키마 변경 반영:
   - job.source: 한글 -> 영문 (SARAMIN, JOBKOREA)
   - job.apply 컬럼 추가 (PENDING, APPLY)
   - job.edu_require, job.emp_type, job.pay 컬럼 추가
   - job.post_id UNIQUE (동일 공고 중복 수집 방지)
   - User 테이블 -> members로 명칭 변경, job_id/portfolio_id FK 추가
   - members.user_region, user_personal_history, user_edu_require, user_emp_type, user_pay 컬럼 추가
*/

// ---- 공통 옵션 값 ----

// 직무 (job.job_part / members.user_job_part)
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

// 학력조건 (job.edu_require / members.user_edu_require)
const EDU_OPTIONS = ["학력무관", "고졸", "초대졸", "대졸", "대졸 이상", "석사 이상"];

// 고용형태 (job.emp_type / members.user_emp_type)
const EMP_TYPE_OPTIONS = ["정규직", "계약직", "인턴", "프리랜서", "무관"];

// 희망 급여 (members.user_pay)
const PAY_OPTIONS = ["3,000만원 미만", "3,000~4,000만원", "4,000~5,000만원", "5,000만원 이상", "협의 가능"];

// 플랫폼(source) 표기 - DB값은 영문, 화면 표시는 한글
const SOURCE_LABELS = { JOBKOREA: "잡코리아", SARAMIN: "사람인" };

// ---- 채용 공고(job) 목업 ----
const MOCK_JOBS = [
  {
    job_id: 1, post_id: "JK-20260701-001", source: "JOBKOREA",
    job_part: "프론트엔드 개발자", company_name: "네오위즈", post_title: "프론트엔드 개발자 (React) 채용",
    region: "서울 강남구", personal_history: "신입/경력 3년 이하", edu_require: "학력무관", emp_type: "정규직",
    pay: "면접 후 결정", end_at: "2026-07-25", crawled_at: "2026-07-10",
    job_url: "https://www.jobkorea.co.kr/", apply: "PENDING",
  },
  {
    job_id: 2, post_id: "SR-20260702-001", source: "SARAMIN",
    job_part: "백엔드 개발자", company_name: "왓챠", post_title: "백엔드 서버 개발자 모집 (Node.js/Java)",
    region: "서울 마포구", personal_history: "경력 2~5년", edu_require: "대졸 이상", emp_type: "정규직",
    pay: "4,000~5,200만원", end_at: "2026-07-31", crawled_at: "2026-07-10",
    job_url: "https://www.saramin.co.kr/", apply: "PENDING",
  },
  {
    job_id: 3, post_id: "JK-20260703-002", source: "JOBKOREA",
    job_part: "풀스택 개발자", company_name: "리디", post_title: "풀스택 개발자 채용 (React/Spring)",
    region: "서울 강남구", personal_history: "경력무관", edu_require: "학력무관", emp_type: "정규직",
    pay: "3,600~4,800만원", end_at: "2026-08-05", crawled_at: "2026-07-10",
    job_url: "https://www.jobkorea.co.kr/", apply: "APPLY",
  },
  {
    job_id: 4, post_id: "SR-20260704-002", source: "SARAMIN",
    job_part: "DevOps 엔지니어", company_name: "쏘카", post_title: "DevOps 엔지니어 (AWS/Kubernetes)",
    region: "경기 성남시", personal_history: "경력 3년 이상", edu_require: "대졸 이상", emp_type: "정규직",
    pay: "5,000만원 이상", end_at: "2026-07-20", crawled_at: "2026-07-10",
    job_url: "https://www.saramin.co.kr/", apply: "PENDING",
  },
  {
    job_id: 5, post_id: "JK-20260705-003", source: "JOBKOREA",
    job_part: "데이터 분석가", company_name: "뤼이드", post_title: "데이터 분석가 채용 (SQL/Python)",
    region: "서울 성동구", personal_history: "신입/경력", edu_require: "학력무관", emp_type: "정규직",
    pay: "면접 후 결정", end_at: "2026-08-10", crawled_at: "2026-07-10",
    job_url: "https://www.jobkorea.co.kr/", apply: "PENDING",
  },
  {
    job_id: 6, post_id: "SR-20260706-003", source: "SARAMIN",
    job_part: "프론트엔드 개발자", company_name: "당근마켓", post_title: "프론트엔드 엔지니어 (TypeScript)",
    region: "서울 서초구", personal_history: "경력 1~4년", edu_require: "학력무관", emp_type: "정규직",
    pay: "4,200~5,000만원", end_at: "2026-07-28", crawled_at: "2026-07-10",
    job_url: "https://www.saramin.co.kr/", apply: "PENDING",
  },
  {
    job_id: 7, post_id: "JK-20260707-004", source: "JOBKOREA",
    job_part: "백엔드 개발자", company_name: "무신사", post_title: "백엔드 개발자 (Python/FastAPI)",
    region: "서울 성동구", personal_history: "경력 2년 이상", edu_require: "대졸 이상", emp_type: "계약직",
    pay: "3,800~4,600만원", end_at: "2026-08-02", crawled_at: "2026-07-10",
    job_url: "https://www.jobkorea.co.kr/", apply: "PENDING",
  },
  {
    job_id: 8, post_id: "SR-20260708-004", source: "SARAMIN",
    job_part: "풀스택 개발자", company_name: "컬리", post_title: "풀스택 개발자 (Next.js/NestJS)",
    region: "경기 성남시", personal_history: "경력 3~7년", edu_require: "학력무관", emp_type: "정규직",
    pay: "4,500~6,000만원", end_at: "2026-07-22", crawled_at: "2026-07-10",
    job_url: "https://www.saramin.co.kr/", apply: "PENDING",
  },
];

// "수집하기" 버튼 클릭 시 순차로 추가되는 신규 수집분 (post_id UNIQUE 데모용).
// 3번째 클릭은 1번 공고와 동일한 post_id로 재수집되어 중복 제거되는 상황을 시연한다.
const EXTRA_JOBS_POOL = [
  {
    job_id: 9, post_id: "JK-20260709-005", source: "JOBKOREA",
    job_part: "DevOps 엔지니어", company_name: "토스", post_title: "DevOps/SRE 엔지니어 채용",
    region: "서울 강남구", personal_history: "경력 3~6년", edu_require: "학력무관", emp_type: "정규직",
    pay: "5,500만원 이상", end_at: "2026-08-15", crawled_at: null,
    job_url: "https://www.jobkorea.co.kr/", apply: "PENDING",
  },
  {
    job_id: 10, post_id: "SR-20260710-005", source: "SARAMIN",
    job_part: "데이터 분석가", company_name: "야놀자", post_title: "데이터 분석가 (BI/Data Engineer)",
    region: "경기 성남시", personal_history: "경력 1~3년", edu_require: "대졸 이상", emp_type: "정규직",
    pay: "면접 후 결정", end_at: "2026-08-12", crawled_at: null,
    job_url: "https://www.saramin.co.kr/", apply: "PENDING",
  },
  {
    // post_id가 job_id 1과 동일 -> UNIQUE 제약으로 중복 저장되지 않아야 함
    job_id: 11, post_id: "JK-20260701-001", source: "JOBKOREA",
    job_part: "프론트엔드 개발자", company_name: "네오위즈", post_title: "프론트엔드 개발자 (React) 채용 [재수집]",
    region: "서울 강남구", personal_history: "신입/경력 3년 이하", edu_require: "학력무관", emp_type: "정규직",
    pay: "면접 후 결정", end_at: "2026-07-25", crawled_at: null,
    job_url: "https://www.jobkorea.co.kr/", apply: "PENDING",
  },
];

// ---- 회원(members) 목업 ----
const MOCK_MEMBER = {
  user_id: 1,
  job_id: 3,           // FK: 최근 관심 등록/지원한 공고 (리디 - 풀스택 개발자)
  portfolio_id: 1,     // FK: 본인 포트폴리오
  email: "doyeon.kim@example.com",
  password: "********", // 비밀번호는 화면에 노출하지 않음 (해시 저장 가정)
  nickname: "doyeon_kim",
  user_job_part: "프론트엔드 개발자",
  user_region: "서울",
  user_personal_history: "경력무관",
  user_edu_require: "학력무관",
  user_emp_type: "정규직",
  user_pay: "4,000~5,000만원",
};

// ---- 포트폴리오 초기 목업 데이터 ----
const MOCK_PORTFOLIO = {
  username: "doyeon",
  displayName: "김도연",
  intro: "사용자 중심의 프론트엔드를 고민하는 개발자입니다.",
  skills: "React, TypeScript, JavaScript, HTML/CSS",
  projectTitle: "취업 지원 서비스 MVP",
  projectDescription: "잡코리아/사람인 공고 수집과 포트폴리오 관리를 한 곳에서 제공하는 3일 MVP 프로젝트입니다.",
  githubUrl: "https://github.com/doyeon-kim",
  contact: "doyeon.kim@example.com",
  cnameValue: "service-domain.example.com",
};

// ---- localStorage 헬퍼 (백엔드 연동 전 임시 저장소) ----

function loadPortfolio() {
  const saved = localStorage.getItem("mvp_portfolio");
  return saved ? JSON.parse(saved) : { ...MOCK_PORTFOLIO };
}
function savePortfolio(data) {
  localStorage.setItem("mvp_portfolio", JSON.stringify(data));
}

// members 희망 조건 (user_job_part, user_region, user_personal_history, user_edu_require, user_emp_type, user_pay)
function loadMemberPrefs() {
  const saved = localStorage.getItem("mvp_member_prefs");
  if (saved) {
    const prefs = JSON.parse(saved);
    return {
      user_edu_require: EDU_OPTIONS[0],
      user_emp_type: EMP_TYPE_OPTIONS[0],
      ...prefs,
    };
  }
  const {
    user_job_part, user_region, user_personal_history,
    user_edu_require, user_emp_type, user_pay,
  } = MOCK_MEMBER;
  return { user_job_part, user_region, user_personal_history, user_edu_require, user_emp_type, user_pay };
}
function saveMemberPrefs(prefs) {
  localStorage.setItem("mvp_member_prefs", JSON.stringify(prefs));
}

// members 계정 정보 (email, password, nickname) - 회원가입 화면에서 사용
function loadMemberAccount() {
  const saved = localStorage.getItem("mvp_member_account");
  if (saved) return JSON.parse(saved);
  const { email, password, nickname } = MOCK_MEMBER;
  return { email, password, nickname };
}
function saveMemberAccount(account) {
  localStorage.setItem("mvp_member_account", JSON.stringify(account));
}

// job.apply 상태는 post_id 기준으로 저장 (재수집되어도 상태 유지)
function loadApplyStatus() {
  const saved = localStorage.getItem("mvp_apply_status");
  return saved ? JSON.parse(saved) : {};
}
function saveApplyStatus(map) {
  localStorage.setItem("mvp_apply_status", JSON.stringify(map));
}

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
