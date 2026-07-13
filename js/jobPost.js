const sourceFilter = document.getElementById("sourceFilter");
const jobPartFilter = document.getElementById("jobPartFilter");
const regionFilter = document.getElementById("regionFilter");
const jobList = document.getElementById("jobList");
const emptyState = document.getElementById("emptyState");

// 서버에서 받아온 현재 페이지의 공고 목록 (source 필터는 화면에서만 적용)
let allJobs = [];

// 출처(source) 필터 옵션 - DB값은 영문(JOBKOREA/SARAMIN), 화면은 한글 표기
Object.entries(SOURCE_LABELS).forEach(([value, label]) => {
  const opt = document.createElement("option");
  opt.value = value;
  opt.textContent = label;
  sourceFilter.appendChild(opt);
});

function daysLeft(deadline) {
  const diff = Math.ceil((new Date(deadline) - new Date()) / 86400000);
  return diff;
}

async function loadJobs() {
  const params = new URLSearchParams({ page: "1", size: "100" });
  const jobPart = jobPartFilter.value;
  const region = regionFilter.value;
  if (jobPart && jobPart !== "all") params.set("job_part", jobPart);
  if (region && region !== "all" && region !== "전국") params.set("region", region);

  try {
    const data = await apiRequest(`/jobs?${params.toString()}`);
    allJobs = data.jobs;
    renderJobs();
  } catch (err) {
    showToast(err.message);
  }
}

async function toggleApply(postId) {
  try {
    const result = await apiRequest(`/jobs/${encodeURIComponent(postId)}/apply`, { method: "PATCH" });
    const job = allJobs.find((j) => j.post_id === postId);
    if (job) job.my_apply_status = result.apply;
    renderJobs();
  } catch (err) {
    showToast(err.message);
  }
}

function renderJobs() {
  const source = sourceFilter.value;

  const filtered = allJobs.filter((job) => source === "all" || job.source === source);

  jobList.innerHTML = "";
  if (filtered.length === 0) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  filtered.forEach((job) => {
    const left = daysLeft(job.end_at);
    const applyState = job.my_apply_status;
    const card = document.createElement("div");
    card.className = "card job-card";
    card.innerHTML = `
      <div class="job-main">
        <div class="job-top">
          <span class="badge badge-${job.source.toLowerCase()}">${SOURCE_LABELS[job.source] || job.source}</span>
          <span class="job-company">${job.company_name}</span>
        </div>
        <div class="job-title">${job.post_title}</div>
        <div class="job-meta">
          <span>📍 ${job.region}</span>
          <span>🧑‍💻 ${job.personal_history}</span>
          <span>💰 ${job.pay}</span>
          <span class="${left <= 7 ? "deadline-soon" : ""}">⏰ 마감 ${job.end_at}${left >= 0 ? ` (D-${left})` : ""}</span>
          <span>🏷 ${job.job_part}</span>
        </div>
      </div>
      <div class="job-actions">
        <button class="btn btn-sm" onclick="window.open('${job.job_url}', '_blank')">원문 보기 ↗</button>
        <button class="btn btn-sm ${applyState === "APPLY" ? "" : "btn-primary"}" onclick="toggleApply('${job.post_id}')">${applyState === "APPLY" ? "지원완료" : "지원하기"}</button>
      </div>
    `;
    jobList.appendChild(card);
  });
}

sourceFilter.addEventListener("change", renderJobs);
jobPartFilter.addEventListener("change", loadJobs);
regionFilter.addEventListener("change", loadJobs);

(async function init() {
  const me = await requireLogin();
  if (!me) return;

  // 직무 필터 옵션 - 회원의 희망 직무(user_job_part)를 우선 표시
  POSITIONS.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p + (p === me.user_job_part ? " (희망 직무)" : "");
    jobPartFilter.appendChild(opt);
  });
  if (me.user_job_part) {
    jobPartFilter.value = me.user_job_part;
  }

  // 지역 필터 옵션 - 회원의 희망 지역(user_region) 우선 표시
  REGION_OPTIONS.forEach((r) => {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r + (r === me.user_region ? " (희망 지역)" : "");
    regionFilter.appendChild(opt);
  });
  if (me.user_region) {
    regionFilter.value = me.user_region;
  }

  await loadJobs();
})();
