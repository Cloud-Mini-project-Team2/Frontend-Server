function submitLogin() {
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

  const account = loadMemberAccount();
  if (email !== account.email || password !== account.password) {
    showToast("이메일 또는 비밀번호가 일치하지 않습니다.");
    return;
  }

  showToast("로그인되었습니다.");
  setTimeout(() => {
    window.location.href = "userInfo.html";
  }, 900);
}

document.getElementById("loginBtn").addEventListener("click", submitLogin);
document.getElementById("inputPassword").addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitLogin();
});
