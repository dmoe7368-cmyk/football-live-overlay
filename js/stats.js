// ========================================================
// FotMob Match ID (Controller က ပို့လျှင် Auto မိမည်၊ သို့မဟုတ် လက်ဖြင့် ထည့်နိုင်သည်)
// ========================================================
const DEFAULT_MATCH_ID = "5795480"; 

let currentStatsMatchId = DEFAULT_MATCH_ID;
let statsFetchTimer = null;
let isStatsVisibleByController = false;

// Firebase Listener
matchRef.on('value', (snap) => {
  const data = snap.val();
  if (!data) return;

  isStatsVisibleByController = (data.showStats === true);
  const panel = document.getElementById('stats-panel');
  if (!panel) return;

  if (!isStatsVisibleByController) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';

  const activeMatchId = data.fotmobMatchId || DEFAULT_MATCH_ID;
  if (activeMatchId && activeMatchId !== currentStatsMatchId) {
    currentStatsMatchId = activeMatchId;
  }

  // ချက်ချင်း ၁ ကြိမ် ဆွဲယူမည်
  fetchMatchStatsFromVercel(currentStatsMatchId);

  // စက္ကန့် ၂၀ တစ်ကြိမ် အလိုအလျောက် Live Update လုပ်မည်
  clearInterval(statsFetchTimer);
  statsFetchTimer = setInterval(() => {
    if (isStatsVisibleByController && currentStatsMatchId) {
      fetchMatchStatsFromVercel(currentStatsMatchId);
    }
  }, 20000);
});

// Vercel Serverless Function ဆီသို့ တိုက်ရိုက် ခေါ်ယူခြင်း
async function fetchMatchStatsFromVercel(matchId) {
  try {
    const res = await fetch(`/api/stats?matchId=${matchId}`);
    if (!res.ok) throw new Error("Vercel API error");

    const data = await res.json();

    // Stats ဒေတာ စာရင်းကို အဆင့်ဆင့် ရှာဖွေခြင်း
    const statsData = data?.content?.stats?.Periods?.All?.stats 
      || data?.content?.stats?.stats 
      || (Array.isArray(data?.content?.stats) ? data?.content?.stats : []);

    if (statsData.length > 0) {
      renderDisplayStats(statsData, "LIVE");
    }
  } catch (err) {
    console.warn("Stats fetch failed:", err);
  }
}

// Stats UI တွင် ဂဏန်းများ ထည့်သွင်းပြသခြင်း
function renderDisplayStats(statsGroups, badgeText = "LIVE") {
  const badge = document.querySelector('.stats-live-dot');
  if (badge) badge.textContent = badgeText;

  let statsMap = {};

  if (statsGroups && statsGroups.length) {
    statsGroups.forEach(group => {
      (group.stats || []).forEach(item => {
        const title = (item.title || "").toLowerCase();
        const vals = item.stats || [];
        if (vals.length >= 2) {
          statsMap[title] = { home: vals[0], away: vals[1] };
        }
      });
    });
  }

  function getStatVal(keywords, defaultHome = "0", defaultAway = "0") {
    for (const key in statsMap) {
      if (keywords.some(kw => key.includes(kw))) {
        return statsMap[key];
      }
    }
    return { home: defaultHome, away: defaultAway };
  }

  // 1. Ball Possession
  const posData = getStatVal(["possession"], "50%", "50%");
  const hPos = parseInt(posData.home) || 50;
  const aPos = parseInt(posData.away) || 50;
  
  const elHPos = document.getElementById('stat-pos-home');
  const elAPos = document.getElementById('stat-pos-away');
  const barH = document.getElementById('pos-bar-home');
  const barA = document.getElementById('pos-bar-away');

  if (elHPos) elHPos.textContent = `${hPos}%`;
  if (elAPos) elAPos.textContent = `${aPos}%`;
  if (barH) barH.style.width = `${hPos}%`;
  if (barA) barA.style.width = `${aPos}%`;

  // 2. Rows: xG, Shots, Passes, Corners, Fouls, Saves
  const rowConfigs = [
    { keywords: ["expected goals", "xg"], label: "xG", defH: "0.00", defA: "0.00" },
    { keywords: ["total shots", "shots"], label: "Total Shots", defH: "0", defA: "0" },
    { keywords: ["shots on target"], label: "Shots on Target", defH: "0", defA: "0" },
    { keywords: ["accurate passes", "passes"], label: "Passes", defH: "0", defA: "0" },
    { keywords: ["corner"], label: "Corners", defH: "0", defA: "0" },
    { keywords: ["fouls"], label: "Fouls", defH: "0", defA: "0" },
    { keywords: ["saves"], label: "Saves", defH: "0", defA: "0" }
  ];

  const listContainer = document.getElementById('stat-items-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  rowConfigs.forEach(cfg => {
    const valObj = getStatVal(cfg.keywords, cfg.defH, cfg.defA);

    const row = document.createElement('div');
    row.className = 'stat-row-item';
    row.innerHTML = `
      <span class="stat-num home">${valObj.home}</span>
      <span class="stat-title-center">${cfg.label}</span>
      <span class="stat-num away">${valObj.away}</span>
    `;
    listContainer.appendChild(row);
  });
}
