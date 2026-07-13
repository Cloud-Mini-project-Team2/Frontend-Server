let portfolio = loadPortfolio();
let pendingImageFile = null;
let pendingHtmlFile = null;

const viewSection = document.getElementById("viewSection");
const editSection = document.getElementById("editSection");

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

// CNAME 레코드의 값: "{cname}.{도메인 네임}".
// 도메인 네임은 CNAME 제공 서비스에서 받을 값이라 지금은 목데이터(MOCK_CNAME_DOMAIN)를 쓴다.
// 예) cname=portfolio -> portfolio.example.com
function buildCnameFullDomain() {
  if (!portfolio.cname) return "";
  return `${portfolio.cname}.${MOCK_CNAME_DOMAIN}`;
}

function renderView() {
  document.getElementById("avatarInitial").textContent = portfolio.nickname.charAt(0);
  document.getElementById("viewNickname").textContent = portfolio.nickname;
  const urlEl = document.getElementById("viewPortfolioUrl");
  urlEl.textContent = portfolio.portfolio_url;
  // 스킴 없이 입력된 URL(pofile.greatsounds.me 등)이 상대경로로 처리되지 않게 보정
  urlEl.href = portfolio.portfolio_url
    ? (/^https?:\/\//.test(portfolio.portfolio_url) ? portfolio.portfolio_url : `https://${portfolio.portfolio_url}`)
    : "#";
  document.getElementById("viewCname").textContent = portfolio.cname;
  document.getElementById("viewCnameFull").textContent = buildCnameFullDomain();

  const viewImage = document.getElementById("viewImage");
  const viewImageEmpty = document.getElementById("viewImageEmpty");
  const imageData = getAsset(portfolio.image_path);
  if (imageData) {
    viewImage.src = imageData;
    viewImage.style.display = "block";
    viewImageEmpty.style.display = "none";
  } else {
    viewImage.removeAttribute("src");
    viewImage.style.display = "none";
    viewImageEmpty.style.display = "block";
  }

  const viewHtmlPreview = document.getElementById("viewHtmlPreview");
  const viewHtmlEmpty = document.getElementById("viewHtmlEmpty");
  const htmlData = getAsset(portfolio.html_path);
  if (htmlData) {
    viewHtmlPreview.srcdoc = htmlData;
    viewHtmlPreview.style.display = "block";
    viewHtmlEmpty.style.display = "none";
  } else {
    viewHtmlPreview.removeAttribute("srcdoc");
    viewHtmlPreview.style.display = "none";
    viewHtmlEmpty.style.display = "block";
  }
}

function fillEditForm() {
  document.getElementById("inputNickname").value = portfolio.nickname;
  document.getElementById("inputPortfolioUrl").value = portfolio.portfolio_url;
  document.getElementById("inputCname").value = portfolio.cname;

  pendingImageFile = null;
  pendingHtmlFile = null;
  document.getElementById("inputImage").value = "";
  document.getElementById("inputHtml").value = "";

  const imagePreview = document.getElementById("imagePreview");
  const existingImage = getAsset(portfolio.image_path);
  if (existingImage) {
    imagePreview.src = existingImage;
    imagePreview.style.display = "block";
  } else {
    imagePreview.removeAttribute("src");
    imagePreview.style.display = "none";
  }

  document.getElementById("htmlCurrentName").textContent = portfolio.html_path
    ? `현재 파일: ${portfolio.html_path.split("/").pop()}`
    : "등록된 HTML 파일이 없습니다.";
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
  readFileAsDataUrl(pendingImageFile).then((dataUrl) => {
    const imagePreview = document.getElementById("imagePreview");
    imagePreview.src = dataUrl;
    imagePreview.style.display = "block";
  });
});

document.getElementById("inputHtml").addEventListener("change", (e) => {
  pendingHtmlFile = e.target.files[0] || null;
  document.getElementById("htmlCurrentName").textContent = pendingHtmlFile
    ? `선택된 파일: ${pendingHtmlFile.name}`
    : (portfolio.html_path ? `현재 파일: ${portfolio.html_path.split("/").pop()}` : "등록된 HTML 파일이 없습니다.");
});

document.getElementById("saveBtn").addEventListener("click", async () => {
  const nickname = document.getElementById("inputNickname").value.trim() || portfolio.nickname;
  const updated = {
    ...portfolio,
    nickname,
    portfolio_url: document.getElementById("inputPortfolioUrl").value.trim(),
    cname: document.getElementById("inputCname").value.trim(),
  };

  // 실 서버에서는 업로드된 파일이 /var/www/html/assets/{nickname}/ 에 저장되고
  // DB(portfolio)에는 그 경로만 기록된다. 여기서는 파일 내용을 경로를 키로 하는
  // 별도 저장소(mvp_portfolio_assets)에 넣어 미리보기를 시뮬레이션한다.
  if (pendingImageFile) {
    const path = assetPathFor(nickname, pendingImageFile.name);
    saveAsset(path, await readFileAsDataUrl(pendingImageFile));
    updated.image_path = path;
  }
  if (pendingHtmlFile) {
    const path = assetPathFor(nickname, pendingHtmlFile.name);
    saveAsset(path, await readFileAsText(pendingHtmlFile));
    updated.html_path = path;
  }

  portfolio = updated;
  savePortfolio(portfolio);
  renderView();
  editSection.style.display = "none";
  viewSection.style.display = "block";
  showToast("포트폴리오가 저장되었습니다.");
});

renderView();
