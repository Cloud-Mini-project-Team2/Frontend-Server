let profile = null;
let pendingImageFile = null;
let pendingFile = null;

const viewSection = document.getElementById("viewSection");
const editSection = document.getElementById("editSection");

// CNAME 레코드의 값: "{cname}.{도메인 네임}".
// 도메인 네임은 CNAME 제공 서비스에서 받을 값이라 지금은 목데이터(MOCK_CNAME_DOMAIN)를 쓴다.
// 예) cname=portfolio -> portfolio.example.com
function buildCnameFullDomain() {
  if (!profile.cname) return "-";
  return `${profile.cname}.${MOCK_CNAME_DOMAIN}`;
}

// 스킴 없이 입력된 URL(pofile.greatsounds.me 등)이 상대경로로 처리되지 않게 보정
function toAbsoluteUrl(url) {
  return /^https?:\/\//.test(url) ? url : `https://${url}`;
}

function renderView() {
  document.getElementById("avatarInitial").textContent = profile.nickname.charAt(0).toUpperCase();
  document.getElementById("viewNickname").textContent = profile.nickname;

  const urlEl = document.getElementById("viewPortfolioUrl");
  urlEl.textContent = profile.portfolio_url || "-";
  urlEl.href = profile.portfolio_url ? toAbsoluteUrl(profile.portfolio_url) : "#";

  document.getElementById("viewCname").textContent = profile.cname || "-";
  document.getElementById("viewCnameFull").textContent = buildCnameFullDomain();

  const viewImage = document.getElementById("viewImage");
  const viewImageEmpty = document.getElementById("viewImageEmpty");
  if (profile.portfolio_img) {
    viewImage.src = profile.portfolio_img;
    viewImage.style.display = "block";
    viewImageEmpty.style.display = "none";
  } else {
    viewImage.removeAttribute("src");
    viewImage.style.display = "none";
    viewImageEmpty.style.display = "block";
  }

  const viewHtmlPreview = document.getElementById("viewHtmlPreview");
  const viewHtmlEmpty = document.getElementById("viewHtmlEmpty");
  if (profile.portfolio_file) {
    viewHtmlPreview.src = profile.portfolio_file;
    viewHtmlPreview.style.display = "block";
    viewHtmlEmpty.style.display = "none";
  } else {
    viewHtmlPreview.removeAttribute("src");
    viewHtmlPreview.style.display = "none";
    viewHtmlEmpty.style.display = "block";
  }
}

function fillEditForm() {
  document.getElementById("viewEditNickname").textContent = profile.nickname;
  document.getElementById("inputPortfolioUrl").value = profile.portfolio_url || "";
  document.getElementById("inputCname").value = profile.cname || "";

  pendingImageFile = null;
  pendingFile = null;
  document.getElementById("inputImage").value = "";
  document.getElementById("inputHtml").value = "";

  const imagePreview = document.getElementById("imagePreview");
  if (profile.portfolio_img) {
    imagePreview.src = profile.portfolio_img;
    imagePreview.style.display = "block";
  } else {
    imagePreview.removeAttribute("src");
    imagePreview.style.display = "none";
  }

  document.getElementById("htmlCurrentName").textContent = profile.portfolio_file
    ? `현재 파일: ${profile.portfolio_file.split("/").pop()}`
    : "등록된 파일이 없습니다.";
}

document.getElementById("editBtn").addEventListener("click", () => {
  fillEditForm();
  viewSection.style.display = "none";
  editSection.style.display = "block";
});

document.getElementById("cancelBtn").addEventListener("click", () => {
  editSection.style.display = "none";
  viewSection.style.display = "block";
});

document.getElementById("inputImage").addEventListener("change", (e) => {
  pendingImageFile = e.target.files[0] || null;
  if (!pendingImageFile) return;
  const imagePreview = document.getElementById("imagePreview");
  imagePreview.src = URL.createObjectURL(pendingImageFile);
  imagePreview.style.display = "block";
});

document.getElementById("inputHtml").addEventListener("change", (e) => {
  pendingFile = e.target.files[0] || null;
  document.getElementById("htmlCurrentName").textContent = pendingFile
    ? `선택된 파일: ${pendingFile.name}`
    : (profile.portfolio_file ? `현재 파일: ${profile.portfolio_file.split("/").pop()}` : "등록된 파일이 없습니다.");
});

document.getElementById("saveBtn").addEventListener("click", async () => {
  const cname = document.getElementById("inputCname").value.trim();
  const portfolioUrl = document.getElementById("inputPortfolioUrl").value.trim();

  try {
    if (pendingImageFile || pendingFile) {
      const formData = new FormData();
      if (pendingImageFile) formData.append("image", pendingImageFile);
      if (pendingFile) formData.append("file", pendingFile);
      const uploadResult = await apiRequest("/users/me/portfolio", {
        method: "POST",
        body: formData,
        isFormData: true,
      });
      if (uploadResult.portfolio_img) profile.portfolio_img = uploadResult.portfolio_img;
      if (uploadResult.portfolio_file) profile.portfolio_file = uploadResult.portfolio_file;
    }

    if (cname) {
      const cnameResult = await apiRequest("/users/me/cname", {
        method: "PUT",
        body: { cname, portfolio_url: portfolioUrl || null },
      });
      profile.cname = cnameResult.cname;
      profile.portfolio_url = cnameResult.portfolio_url;
    }

    renderView();
    editSection.style.display = "none";
    viewSection.style.display = "block";
    showToast("포트폴리오가 저장되었습니다.");
  } catch (err) {
    showToast(err.message);
  }
});

(async function init() {
  profile = await requireLogin();
  if (!profile) return;
  renderView();
})();
