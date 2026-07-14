async function submitLogin() {
  const email = document.getElementById("inputEmail").value.trim();
  const password = document.getElementById("inputPassword").value;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    showToast("올바른 이메일 형식을 입력해주세요.");
    return;
  }
  if (!password) {
    showToast("비밀번호를 입력해주세요.");
    return;
  }

  try {
    await apiRequest("/auth/login", { method: "POST", body: { email, password } });
    runCrawler(); // 로그인 성공 시 크롤링 1회 실행 (응답을 기다리지 않음)
    showToast("로그인되었습니다.");
    setTimeout(() => {
      window.location.href = "userInfo.html";
    }, 900);
  } catch (err) {
    showToast(err.message);
  }
}

document.getElementById("loginBtn").addEventListener("click", submitLogin);
document.getElementById("inputPassword").addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitLogin();
});
