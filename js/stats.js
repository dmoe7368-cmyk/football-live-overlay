// ========================================================
// Leeds United vs Manchester United (Match ID: 5795480)
// ========================================================
const MANUAL_MATCH_ID = "5795480"; 

let currentStatsMatchId = MANUAL_MATCH_ID;
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

  // Match ID 5795480 ဖြင့် တိုက်ရိုက် ဆွဲတင်ခြင်း
  const activeMatchId = data.fotmobMatchId || MANUAL_MATCH_ID;
  if (activeMatchId) {
    currentStatsMatchId = activeMatchId;
    fetchMatchStatsData(currentStatsMatchId);

    clearInterval(statsFetchTimer);
    statsFetchTimer = setInterval(() => {
      if (isStatsVisibleByController && currentStatsMatchId) {
        fetchMatchStatsData(currentStatsMatchId);
      }
    }, 20000); // စက္ကန့် ၂၀ တစ်ကြိမ် အလိုအလျောက် Live Update
  }
});

// Proxy များ အလှည့်ကျ စမ်းသပ် ချိတ်ဆက်မည့် စနစ်
async function fetchWithProxy(targetUrl) {
  const proxyList = [
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?${url}`,
    (url) => `https://api.codetabs.com/v1/proxy?quest=${url}`
  ];

  for (const proxyFn of proxyList) {
    try {
      const res = await fetch(proxyFn(targetUrl));
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Proxy connection trying next...", e);
    }
  }
  throw new Error("All Proxies Failed");
}

// သက်ဆိုင်ရာ Match ID ၏ Stats Data ဆွဲယူခြင်း
async function fetchMatchStatsData(matchId) {
  try {
    const matchApi = `https://www.fotmob.com/api/matchDetails?matchId=${matchId}`;
    const data = await fetchWithProxy(matchApi);

    // FotMob Stats Data Structure ကို အဆင့်ဆင့် ရှာဖွေခြင်း
    const statsData = data?.content?.stats?.Periods?.All?.stats 
      || data?.content?.stats?.stats 
      || (Array.isArray(data?.content?.stats) ? data?.content?.stats : []);

    if (statsData.length > 0) {
      renderDisplayStats(statsData, "LIVE");
    }
  } catch (err) {
    console.warn("Match stats fetch error:", err);
  }
}

// Stats UI သို့ Real-time ဂဏန်းများ ထည့်သွင်းပြသခြင်း
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

  // ခေါင်းစဉ် အပြောင်းအလဲများအတွက် ရှာဖွေပေးမည့် Helper
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
