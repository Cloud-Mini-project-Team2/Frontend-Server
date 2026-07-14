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

  // 희망 조건 폼 채우기 - 직무/지역은 복수 선택 Chip, 저장된 값(쉼표 구분)으로 초기 선택
  const selectedUserJobParts = new Set(parsePrefList(me.user_job_part));
  const selectedUserRegions = new Set(parsePrefList(me.user_region));
  // 과거 텍스트 입력으로 저장된 직무 값(POSITIONS에 없는 값)도 Chip으로
  // 표시해 선택 해제 전까지 유실되지 않도록 옵션에 포함한다.
  const jobPartOptions = [...new Set([...POSITIONS, ...selectedUserJobParts])];
  renderChips(document.getElementById("userJobPartList"), jobPartOptions, selectedUserJobParts);
  renderChips(document.getElementById("userRegionList"), REGION_OPTIONS, selectedUserRegions);
  fillSelect(document.getElementById("userCareerSelect"), CAREER_OPTIONS, me.user_personal_history);
  fillSelect(document.getElementById("userPaySelect"), PAY_OPTIONS, me.user_pay);

  document.getElementById("savePrefsBtn").addEventListener("click", async () => {
    if (selectedUserJobParts.size === 0) {
      showToast("희망 직무를 1개 이상 선택해주세요.");
      return;
    }
    try {
      await apiRequest("/users/me/preferences", {
        method: "PUT",
        body: {
          user_job_part: Array.from(selectedUserJobParts).join(","),
          user_region: Array.from(selectedUserRegions).join(","),
          user_personal_history: document.getElementById("userCareerSelect").value,
          user_pay: document.getElementById("userPaySelect").value,
        },
      });
      alert("정보가 수정되었습니다. 크롤링을 다시 실행합니다.");
      runCrawler(); // 변경된 희망 조건 기준으로 크롤링 재실행
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
