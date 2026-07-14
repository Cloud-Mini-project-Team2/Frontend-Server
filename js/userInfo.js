document.getElementById("avatarInitial").textContent = MOCK_MEMBER.nickname.charAt(0).toUpperCase();
document.getElementById("userNickname").textContent = MOCK_MEMBER.nickname;
document.getElementById("userEmail").textContent = MOCK_MEMBER.email;

// job_id FK -> 최근 관심 등록한 공고 표시
const recentJob = MOCK_JOBS.find((j) => j.job_id === MOCK_MEMBER.job_id);
if (recentJob) {
  document.getElementById("recentJobTitle").textContent = `${recentJob.company_name} - ${recentJob.post_title}`;
}

// portfolio_id FK -> 포트폴리오 요약
const portfolio = loadPortfolio();
document.getElementById("portfolioName").textContent = `${portfolio.projectTitle} (${portfolio.displayName})`;

// 희망 조건 로드
const prefs = loadMemberPrefs();

const jobPartInput = document.getElementById("jobPartInput");
const regionSelect = document.getElementById("regionSelect");

function fillSelect(selectEl, options, currentValue) {
  selectEl.innerHTML = "";
  options.forEach((opt) => {
    const el = document.createElement("option");
    el.value = opt;
    el.textContent = opt;
    if (opt === currentValue) el.selected = true;
    selectEl.appendChild(el);
  });
}
jobPartInput.value = prefs.user_job_part || "";
fillSelect(regionSelect, REGION_OPTIONS, prefs.user_region);
fillSelect(document.getElementById("careerSelect"), CAREER_OPTIONS, prefs.user_personal_history);
fillSelect(document.getElementById("paySelect"), PAY_OPTIONS, prefs.user_pay);

document.getElementById("savePrefsBtn").addEventListener("click", () => {
  const jobPart = jobPartInput.value.trim();
  if (!jobPart) {
    showToast("희망 직무를 입력해주세요.");
    return;
  }
  const newPrefs = {
    user_job_part: jobPart,
    user_region: regionSelect.value,
    user_personal_history: document.getElementById("careerSelect").value,
    user_pay: document.getElementById("paySelect").value,
  };
  saveMemberPrefs(newPrefs);
  showToast("희망 조건이 저장되었습니다.");
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  showToast("로그아웃되었습니다.");
  setTimeout(() => {
    window.location.href = "login.html";
  }, 900);
});

document.getElementById("withdrawBtn").addEventListener("click", () => {
  if (confirm("정말 탈퇴하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다.")) {
    localStorage.removeItem("mvp_portfolio");
    localStorage.removeItem("mvp_member_prefs");
    localStorage.removeItem("mvp_apply_status");
    showToast("회원 탈퇴가 완료되었습니다.");
  }
});
