const jobPartInput = document.getElementById("jobPartInput");
const regionSelect = document.getElementById("regionSelect");

function fillSelect(selectEl, options) {
  selectEl.innerHTML = "";
  options.forEach((opt) => {
    const el = document.createElement("option");
    el.value = opt;
    el.textContent = opt;
    selectEl.appendChild(el);
  });
}
fillSelect(regionSelect, REGION_OPTIONS);
fillSelect(document.getElementById("careerSelect"), CAREER_OPTIONS);
fillSelect(document.getElementById("paySelect"), PAY_OPTIONS);

document.getElementById("signupBtn").addEventListener("click", async () => {
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
  const jobPart = jobPartInput.value.trim();
  if (!jobPart) {
    showToast("희망 직무를 입력해주세요.");
    return;
  }

  try {
    await apiRequest("/auth/signup", {
      method: "POST",
      body: {
        email,
        password,
        nickname,
        user_job_part: jobPart,
        user_region: regionSelect.value,
        user_personal_history: document.getElementById("careerSelect").value,
        user_pay: document.getElementById("paySelect").value,
      },
    });

    showToast("회원가입이 완료되었습니다. 로그인해주세요.");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 900);
  } catch (err) {
    showToast(err.message);
  }
});
