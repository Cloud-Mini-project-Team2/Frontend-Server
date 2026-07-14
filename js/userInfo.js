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

(async function init() {
  const me = await requireLogin();
  if (!me) return;

  document.getElementById("avatarInitial").textContent = me.nickname.charAt(0).toUpperCase();
  document.getElementById("userNickname").textContent = me.nickname;
  document.getElementById("userEmail").textContent = me.email;

  // 최근 지원/관심 등록한 공고 표시
  try {
    const appData = await apiRequest("/users/me/applications?page=1&size=1");
    const recentApplication = appData.applications[0];
    if (recentApplication) {
      document.getElementById("recentJobTitle").textContent =
        `${recentApplication.company_name} - ${recentApplication.post_title}`;
    }
  } catch (err) {
    // 조회 실패 시 기본값("-")을 그대로 둔다.
  }

  // 포트폴리오 요약
  document.getElementById("portfolioName").textContent = me.cname
    ? `${me.nickname} (${me.portfolio_url || me.cname})`
    : "등록된 포트폴리오가 없습니다.";

  // 희망 조건 폼 채우기
  const jobPartInput = document.getElementById("jobPartInput");
  const regionSelect = document.getElementById("regionSelect");
  jobPartInput.value = me.user_job_part || "";
  fillSelect(regionSelect, REGION_OPTIONS, me.user_region);
  fillSelect(document.getElementById("careerSelect"), CAREER_OPTIONS, me.user_personal_history);
  fillSelect(document.getElementById("paySelect"), PAY_OPTIONS, me.user_pay);

  document.getElementById("savePrefsBtn").addEventListener("click", async () => {
    const jobPart = jobPartInput.value.trim();
    if (!jobPart) {
      showToast("희망 직무를 입력해주세요.");
      return;
    }
    try {
      await apiRequest("/users/me/preferences", {
        method: "PUT",
        body: {
          user_job_part: jobPart,
          user_region: regionSelect.value,
          user_personal_history: document.getElementById("careerSelect").value,
          user_pay: document.getElementById("paySelect").value,
        },
      });
      showToast("희망 조건이 저장되었습니다.");
    } catch (err) {
      showToast(err.message);
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } finally {
      showToast("로그아웃되었습니다.");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 900);
    }
  });

  document.getElementById("withdrawBtn").addEventListener("click", async () => {
    if (!confirm("정말 탈퇴하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다.")) {
      return;
    }
    try {
      await apiRequest("/users/me", { method: "DELETE" });
      showToast("회원 탈퇴가 완료되었습니다.");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 900);
    } catch (err) {
      showToast(err.message);
    }
  });
})();
