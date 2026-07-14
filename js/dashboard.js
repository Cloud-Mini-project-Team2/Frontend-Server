const applyStatusMap = loadApplyStatus();
const prefs = loadMemberPrefs();

function getApplyState(job) {
  return applyStatusMap[job.post_id] || job.apply;
}

// ---- 지원 현황 통계 ----
const total = MOCK_JOBS.length;
const applied = MOCK_JOBS.filter((job) => getApplyState(job) === "APPLY").length;
const pending = total - applied;
const rate = total ? Math.round((applied / total) * 100) : 0;

document.getElementById("statTotal").textContent = total;
document.getElementById("statApplied").textContent = applied;
document.getElementById("statPending").textContent = pending;
document.getElementById("statRate").textContent = `${rate}%`;
document.getElementById("statBarFill").style.width = `${rate}%`;

// ---- 희망 조건 요약 ----
document.getElementById("prefJobPart").textContent = prefs.user_job_part || "미설정";
document.getElementById("prefRegion").textContent = prefs.user_region || "미설정";
document.getElementById("prefCareer").textContent = prefs.user_personal_history || "미설정";
document.getElementById("prefPay").textContent = prefs.user_pay || "미설정";

// ---- 추천 채용 공고 ----
// 희망 직무/지역과 일치하는 공고를 우선순위로, 그 안에서는 마감일이 가까운 순으로 정렬
function matchScore(job) {
  let score = 0;
  if (prefs.user_job_part && job.job_part === prefs.user_job_part) score += 2;
  if (prefs.user_region && job.region.includes(prefs.user_region)) score += 1;
  return score;
}

function daysLeft(deadline) {
  return Math.ceil((new Date(deadline) - new Date()) / 86400000);
}

const recommendedList = document.getElementById("recommendedList");
const recommended = [...MOCK_JOBS]
  .sort((a, b) => new Date(a.end_at) - new Date(b.end_at))
  .sort((a, b) => matchScore(b) - matchScore(a))
  .slice(0, 5);

recommended.forEach((job) => {
  const left = daysLeft(job.end_at);
  const applyState = getApplyState(job);
  const isMatch = matchScore(job) > 0;
  const card = document.createElement("div");
  card.className = "card job-card";
  card.innerHTML = `
    <div class="job-main">
      <div class="job-top">
        <span class="badge ${job.source === "JOBKOREA" ? "badge-jobkorea" : "badge-saramin"}">${SOURCE_LABELS[job.source]}</span>
        <span class="job-company">${job.company_name}</span>
        ${isMatch ? '<span class="badge match-badge">맞춤 추천</span>' : ""}
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
      <span class="badge ${applyState === "APPLY" ? "badge-apply-done" : "badge-apply-pending"}">${applyState === "APPLY" ? "지원완료" : "대기중"}</span>
    </div>
  `;
  recommendedList.appendChild(card);
});
