const jobPartList = document.getElementById("jobPartList");
const regionList = document.getElementById("regionList");
const selectedJobParts = new Set();
const selectedRegions = new Set();

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

function fillSelect(selectEl, options) {
  selectEl.innerHTML = "";
  options.forEach((opt) => {
    const el = document.createElement("option");
    el.value = opt;
    el.textContent = opt;
    selectEl.appendChild(el);
  });
}
fillSelect(document.getElementById("careerSelect"), CAREER_OPTIONS);
fillSelect(document.getElementById("paySelect"), PAY_OPTIONS);

document.getElementById("signupBtn").addEventListener("click", () => {
  const email = document.getElementById("inputEmail").value.trim();
  const password = document.getElementById("inputPassword").value;
  const nickname = document.getElementById("inputNickname").value.trim();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nicknamePattern = /^[A-Za-z0-9_]{2,20}$/;

  if (!emailPattern.test(email)) {
    showToast("올바른 이메일 형식을 입력해주세요.");
    return;
  }
  if (password.length < 8) {
    showToast("비밀번호는 8자 이상 입력해주세요.");
    return;
  }
  if (!nicknamePattern.test(nickname)) {
    showToast("닉네임은 영문/숫자/_ 2~20자로 입력해주세요.");
    return;
  }
  if (selectedJobParts.size === 0) {
    showToast("희망 직무를 1개 이상 선택해주세요.");
    return;
  }
  if (selectedRegions.size === 0) {
    showToast("희망 지역을 1개 이상 선택해주세요.");
    return;
  }

  saveMemberAccount({ email, password, nickname });
  saveMemberPrefs({
    user_job_part: Array.from(selectedJobParts),
    user_region: Array.from(selectedRegions),
    user_personal_history: document.getElementById("careerSelect").value,
    user_pay: document.getElementById("paySelect").value,
  });

  showToast("회원가입이 완료되었습니다.");
  setTimeout(() => {
    window.location.href = "userInfo.html";
  }, 900);
});
