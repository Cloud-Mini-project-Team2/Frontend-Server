const sourceFilter = document.getElementById("sourceFilter");
const jobPartFilter = document.getElementById("jobPartFilter");
const regionFilter = document.getElementById("regionFilter");
const jobList = document.getElementById("jobList");
const emptyState = document.getElementById("emptyState");
const collectStatus = document.getElementById("collectStatus");
const collectBtn = document.getElementById("collectBtn");
const failBanner = document.getElementById("failBanner");

// 전체 수집 결과 (post_id UNIQUE 제약을 흉내내기 위해 배열로 관리)
let allJobs = [...MOCK_JOBS];
let applyStatusMap = loadApplyStatus();
let collectStep = 0;

// 출처(source) 필터 옵션 - DB값은 영문(JOBKOREA/SARAMIN), 화면은 한글 표기
Object.entries(SOURCE_LABELS).forEach(([value, label]) => {
  const opt = document.createElement("option");
  opt.value = value;
  opt.textContent = label;
  sourceFilter.appendChild(opt);
});

// 직무 필터 옵션 - 회원의 희망 직무(user_job_part)를 우선 표시
const memberPrefs = loadMemberPrefs();
POSITIONS.forEach((p) => {
  const opt = document.createElement("option");
  opt.value = p;
  opt.textContent = p + (p === memberPrefs.user_job_part ? " (희망 직무)" : "");
  jobPartFilter.appendChild(opt);
});
if (memberPrefs.user_job_part) {
  jobPartFilter.value = memberPrefs.user_job_part;
}

// 지역 필터 옵션 - 회원의 희망 지역(user_region) 우선 표시
REGION_OPTIONS.forEach((r) => {
  const opt = document.createElement("option");
  opt.value = r;
  opt.textContent = r + (r === memberPrefs.user_region ? " (희망 지역)" : "");
  regionFilter.appendChild(opt);
});
if (memberPrefs.user_region) {
  regionFilter.value = memberPrefs.user_region;
}

function daysLeft(deadline) {
  const diff = Math.ceil((new Date(deadline) - new Date()) / 86400000);
  return diff;
}

function getApplyState(job) {
  return applyStatusMap[job.post_id] || job.apply;
}

function toggleApply(postId) {
  const current = applyStatusMap[postId] || allJobs.find((j) => j.post_id === postId).apply;
  applyStatusMap[postId] = current === "APPLY" ? "PENDING" : "APPLY";
  saveApplyStatus(applyStatusMap);
  renderJobs();
}

function renderJobs() {
  const source = sourceFilter.value;
  const jobPart = jobPartFilter.value;
  const region = regionFilter.value;

  const filtered = allJobs.filter((job) => {
    const matchSource = source === "all" || job.source === source;
    const matchJobPart = jobPart === "all" || job.job_part === jobPart;
    const matchRegion = region === "all" || region === "전국" || job.region.includes(region);
    return matchSource && matchJobPart && matchRegion;
  });

  jobList.innerHTML = "";
  if (filtered.length === 0) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  filtered.forEach((job) => {
    const left = daysLeft(job.end_at);
    const applyState = getApplyState(job);
    const card = document.createElement("div");
    card.className = "card job-card";
    card.innerHTML = `
      <div class="job-main">
        <div class="job-top">
          <span class="badge ${job.source === "JOBKOREA" ? "badge-jobkorea" : "badge-saramin"}">${SOURCE_LABELS[job.source]}</span>
          <span class="job-company">${job.company_name}</span>
        </div>
        <div class="job-title">${job.post_title}</div>
        <div class="job-meta">
          <span>📍 ${job.region}</span>
          <span>🧑‍💻 ${job.personal_history}</span>
          <span>🎓 ${job.edu_require}</span>
          <span>🏢 ${job.emp_type}</span>
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
jobPartFilter.addEventListener("change", renderJobs);
regionFilter.addEventListener("change", renderJobs);

collectBtn.addEventListener("click", () => {
  failBanner.style.display = "none";
  collectStatus.textContent = "수집 중...";
  collectBtn.disabled = true;
  setTimeout(() => {
    collectBtn.disabled = false;
    collectStatus.textContent = "";
    collectStep += 1;
    const next = EXTRA_JOBS_POOL[collectStep - 1];

    if (!next) {
      showToast("새로운 공고가 없습니다.");
      return;
    }

    const isDuplicate = allJobs.some((j) => j.post_id === next.post_id);
    if (isDuplicate) {
      showToast(`중복 공고 제거됨 (post_id: ${next.post_id})`);
    } else {
      allJobs.push({ ...next, crawled_at: "2026-07-10" });
      renderJobs();
      showToast(`신규 공고 ${next.company_name} - ${next.post_title} 수집 완료`);
    }
  }, 700);
});

renderJobs();
