let portfolio = loadPortfolio();

const viewSection = document.getElementById("viewSection");
const editSection = document.getElementById("editSection");

function renderView() {
  document.getElementById("avatarInitial").textContent = portfolio.displayName.charAt(0);
  document.getElementById("viewName").textContent = portfolio.displayName;
  const publicUrl = `/portfolio/${portfolio.username}`;
  const urlEl = document.getElementById("viewUrl");
  urlEl.textContent = publicUrl;
  urlEl.href = publicUrl;
  document.getElementById("viewIntro").textContent = portfolio.intro;
  document.getElementById("viewSkills").textContent = portfolio.skills;
  document.getElementById("viewProjectTitle").textContent = portfolio.projectTitle;
  document.getElementById("viewProjectDesc").textContent = portfolio.projectDescription;
  const githubEl = document.getElementById("viewGithub");
  githubEl.textContent = portfolio.githubUrl;
  githubEl.href = portfolio.githubUrl;
  document.getElementById("viewContact").textContent = portfolio.contact;
  document.getElementById("viewCname").textContent = portfolio.cnameValue;
}

function fillEditForm() {
  document.getElementById("inputName").value = portfolio.displayName;
  document.getElementById("inputIntro").value = portfolio.intro;
  document.getElementById("inputSkills").value = portfolio.skills;
  document.getElementById("inputProjectTitle").value = portfolio.projectTitle;
  document.getElementById("inputProjectDesc").value = portfolio.projectDescription;
  document.getElementById("inputGithub").value = portfolio.githubUrl;
  document.getElementById("inputContact").value = portfolio.contact;
  document.getElementById("inputCname").value = portfolio.cnameValue;
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

document.getElementById("saveBtn").addEventListener("click", () => {
  portfolio = {
    ...portfolio,
    displayName: document.getElementById("inputName").value.trim() || portfolio.displayName,
    intro: document.getElementById("inputIntro").value.trim(),
    skills: document.getElementById("inputSkills").value.trim(),
    projectTitle: document.getElementById("inputProjectTitle").value.trim(),
    projectDescription: document.getElementById("inputProjectDesc").value.trim(),
    githubUrl: document.getElementById("inputGithub").value.trim(),
    contact: document.getElementById("inputContact").value.trim(),
    cnameValue: document.getElementById("inputCname").value.trim(),
  };
  savePortfolio(portfolio);
  renderView();
  editSection.style.display = "none";
  viewSection.style.display = "block";
  showToast("포트폴리오가 저장되었습니다.");
});

renderView();
