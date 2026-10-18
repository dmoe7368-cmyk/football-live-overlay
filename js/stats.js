// ========================================================
// Leeds United vs Manchester United (Match ID: 4589210)
// ========================================================
const MANUAL_MATCH_ID = "4589210"; 

let currentStatsMatchId = MANUAL_MATCH_ID;
let statsFetchTimer = null;
let isStatsVisibleByController = false;

// FotMob အသင်းအမည် Search Map
const FOTMOB_TEAM_NAMES = {
  ars: "Arsenal", avl: "Aston Villa", bou: "Bournemouth", bre: "Brentford",
  bha: "Brighton", che: "Chelsea", cov: "Coventry", cry: "Crystal Palace",
  eve: "Everton", ful: "Fulham", hul: "Hull", ips: "Ipswich",
  lee: "Leeds", liv: "Liverpool", mci: "Manchester City", mun: "Manchester United",
  new: "Newcastle", nfo: "Nottingham Forest", sun: "Sunderland", tot: "Tottenham"
};

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

  // သတ်မှတ်ထားသော Match ID ဖြင့် Live Stats တိုက်ရိုက်ဆွဲယူခြင်း
  const activeMatchId = data.fotmobMatchId || MANUAL_MATCH_ID;
  if (activeMatchId) {
    currentStatsMatchId = activeMatchId;
    fetchMatchStatsData(currentStatsMatchId);

    clearInterval(statsFetchTimer);
    statsFetchTimer = setInterval(() => {
      if (isStatsVisibleByController && currentStatsMatchId) {
        fetchMatchStatsData(currentStatsMatchId);
      }
    }, 20000); // ၂၀ စက္ကန့်တစ်ကြိမ် Auto Update
    return;
  }

  const hName = FOTMOB_TEAM_NAMES[data.homeKey] || data.homeName || "Leeds";
  const aName = FOTMOB_TEAM_NAMES[data.awayKey] || data.awayName || "Man United";
  loadMatchStats(hName, aName);
});

// Proxy များ အလှည့်ကျ စမ်းသပ် Fetch မည့် စနစ်
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
      console.warn("Proxy retry...", e);
    }
  }
  throw new Error("All Proxies Failed");
}

// သက်ဆိုင်ရာ Match ID ၏ Stats Data ဆွဲယူခြင်း
async function fetchMatchStatsData(matchId) {
  try {
    const matchApi = `https://www.fotmob.com/api/matchDetails?matchId=${matchId}`;
    const data = await fetchWithProxy(matchApi);

    const statsData = data?.content?.stats?.Periods?.All?.stats || [];
    if (statsData.length > 0) {
      renderDisplayStats(statsData, "LIVE");
    }
  } catch (err) {
    console.warn("Match stats fetch error:", err);
  }
}

// FotMob မှ အလိုအလျောက် ရှာဖွေခြင်း (Fallback)
async function loadMatchStats(homeTeamName, awayTeamName) {
  try {
    const leagueApi = `https://www.fotmob.com/api/leagues?id=47`;
    const json = await fetchWithProxy(leagueApi);

    const matches = json?.overview?.leagueOverviewMatches || [];
    const targetMatch = matches.find(m => {
      const h = (m.home?.name || "").toLowerCase();
      const a = (m.away?.name || "").toLowerCase();
      const sH = (homeTeamName || "").toLowerCase();
      const sA = (awayTeamName || "").toLowerCase();
      return (h.includes(sH) || sH.includes(h)) && (a.includes(sA) || sA.includes(a));
    });

    if (targetMatch && targetMatch.id) {
      currentStatsMatchId = targetMatch.id;
      fetchMatchStatsData(currentStatsMatchId);

      clearInterval(statsFetchTimer);
      statsFetchTimer = setInterval(() => {
        if (isStatsVisibleByController && currentStatsMatchId) {
          fetchMatchStatsData(currentStatsMatchId);
        }
      }, 20000);
    } else {
      renderDisplayStats(null, "LIVE");
    }
  } catch (err) {
    console.warn("Auto find error:", err);
    renderDisplayStats(null, "LIVE");
  }
}

// Stats UI သို့ ဂဏန်းများ တိုက်ရိုက် ထည့်သွင်းခြင်း
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

  // 1. Possession Bar
  const pos = statsMap["ball possession"] || { home: "64%", away: "36%" };
  const hPos = parseInt(pos.home) || 64;
  const aPos = parseInt(pos.away) || 36;
  
  const elHPos = document.getElementById('stat-pos-home');
  const elAPos = document.getElementById('stat-pos-away');
  const barH = document.getElementById('pos-bar-home');
  const barA = document.getElementById('pos-bar-away');

  if (elHPos) elHPos.textContent = `${hPos}%`;
  if (elAPos) elAPos.textContent = `${aPos}%`;
  if (barH) barH.style.width = `${hPos}%`;
  if (barA) barA.style.width = `${aPos}%`;

  // 2. Stats Rows Config
  const rowConfigs = [
    { key: "expected goals (xg)", label: "xG", defH: "0.00", defA: "0.03" },
    { key: "total shots", label: "Total Shots", defH: "0", defA: "0" },
    { key: "shots on target", label: "Shots on Target", defH: "0", defA: "0" },
    { key: "accurate passes", label: "Passes", defH: "62", defA: "29" },
    { key: "corner kicks", label: "Corners", defH: "0", defA: "0" },
    { key: "goalkeeper saves", label: "Saves", defH: "0", defA: "0" }
  ];

  const listContainer = document.getElementById('stat-items-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  rowConfigs.forEach(cfg => {
    const valH = statsMap[cfg.key]?.home ?? cfg.defH;
    const valA = statsMap[cfg.key]?.away ?? cfg.defA;

    const row = document.createElement('div');
    row.className = 'stat-row-item';
    row.innerHTML = `
      <span class="stat-num home">${valH}</span>
      <span class="stat-title-center">${cfg.label}</span>
      <span class="stat-num away">${valA}</span>
    `;
    listContainer.appendChild(row);
  });
}
