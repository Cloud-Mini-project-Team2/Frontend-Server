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
let selectedJobParts = new Set(prefs.user_job_part);
let selectedRegions = new Set(prefs.user_region);

const jobPartList = document.getElementById("jobPartList");
const regionList = document.getElementById("regionList");

function renderChips(container, options, selectedSet) {
  container.innerHTML = "";
  options.forEach((opt) => {
    const chip = document.createElement("div");
    chip.className = "chip" + (selectedSet.has(opt) ? " selected" : "");
    chip.textContent = opt;
    chip.addEventListener("click", () => {
      if (selectedSet.has(opt)) selectedSet.delete(opt);
      else selectedSet.add(opt);
      renderChips(container, options, selectedSet);
    });
    container.appendChild(chip);
  });
}
renderChips(jobPartList, POSITIONS, selectedJobParts);
renderChips(regionList, REGION_OPTIONS, selectedRegions);

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
fillSelect(document.getElementById("careerSelect"), CAREER_OPTIONS, prefs.user_personal_history);
fillSelect(document.getElementById("eduSelect"), EDU_OPTIONS, prefs.user_edu_require);
fillSelect(document.getElementById("empTypeSelect"), EMP_TYPE_OPTIONS, prefs.user_emp_type);
fillSelect(document.getElementById("paySelect"), PAY_OPTIONS, prefs.user_pay);

document.getElementById("savePrefsBtn").addEventListener("click", () => {
  const newPrefs = {
    user_job_part: Array.from(selectedJobParts),
    user_region: Array.from(selectedRegions),
    user_personal_history: document.getElementById("careerSelect").value,
    user_edu_require: document.getElementById("eduSelect").value,
    user_emp_type: document.getElementById("empTypeSelect").value,
    user_pay: document.getElementById("paySelect").value,
  };
  saveMemberPrefs(newPrefs);
  showToast("희망 조건이 저장되었습니다.");
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  showToast("로그아웃되었습니다.");
});

document.getElementById("withdrawBtn").addEventListener("click", () => {
  if (confirm("정말 탈퇴하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다.")) {
    localStorage.removeItem("mvp_portfolio");
    localStorage.removeItem("mvp_member_prefs");
    localStorage.removeItem("mvp_apply_status");
    showToast("회원 탈퇴가 완료되었습니다.");
  }
});
