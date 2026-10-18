let currentStatsMatchId = null;
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

  // Controller က Hide Stats နှိပ်ထားလျှင် ဖျောက်မည်
  if (!isStatsVisibleByController) {
    panel.style.display = 'none';
    return;
  }

  // Show Stats နှိပ်ထားပါက အမြဲတမ်း မျက်နှာပြင်ပေါ် ပေါ်နေစေမည် (ချိန်ကြည့်နိုင်ရန်)
  panel.style.display = 'block';

  const hName = FOTMOB_TEAM_NAMES[data.homeKey] || data.homeName || "Leeds";
  const aName = FOTMOB_TEAM_NAMES[data.awayKey] || data.awayName || "Man United";

  // ပွဲစ/မစ စစ်ဆေးပြီး Stats ဆွဲတင်မည်
  loadMatchStats(hName, aName);
});

// FotMob API မှ Stats ရှာဖွေခြင်း
async function loadMatchStats(homeTeamName, awayTeamName) {
  try {
    const proxyUrl = "https://corsproxy.io/?";
    const leagueApi = `${proxyUrl}https://www.fotmob.com/api/leagues?id=47`;
    
    const res = await fetch(leagueApi);
    if (!res.ok) throw new Error("API Network Busy");
    const json = await res.json();

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
      }, 45000);
    } else {
      // ပွဲမစသေးပါက Frame မပျောက်ဘဲ Preview အနေဖြင့် ဖော်ပြထားမည်
      renderDisplayStats(null, "PRE-MATCH");
    }
  } catch (err) {
    console.warn("FotMob Pending, showing test frame:", err);
    // Error တက်လျှင်လည်း Frame လုံးဝ မဖျောက်ဘဲ စမ်းသပ်ကြည့်နိုင်ရန် ဆက်ပြထားမည်
    renderDisplayStats(null, "STATS");
  }
}

async function fetchMatchStatsData(matchId) {
  try {
    const proxyUrl = "https://corsproxy.io/?";
    const matchApi = `${proxyUrl}https://www.fotmob.com/api/matchDetails?matchId=${matchId}`;

    const res = await fetch(matchApi);
    if (!res.ok) throw new Error("Match Details Fetch Failed");
    const data = await res.json();

    const statsData = data?.content?.stats?.Periods?.All?.stats || [];
    if (statsData.length > 0) {
      renderDisplayStats(statsData, "LIVE");
    } else {
      renderDisplayStats(null, "LIVE");
    }
  } catch (err) {
    renderDisplayStats(null, "LIVE");
  }
}

// Stats UI တွင် ဂဏန်းများ ထည့်သွင်းပြသခြင်း (API မရသေးလျှင် စမ်းသပ်ဂဏန်းဖြင့် ပေါ်နေမည်)
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

  // 1. Possession
  const pos = statsMap["ball possession"] || { home: "52%", away: "48%" };
  const hPos = parseInt(pos.home) || 52;
  const aPos = parseInt(pos.away) || 48;
  
  const elHPos = document.getElementById('stat-pos-home');
  const elAPos = document.getElementById('stat-pos-away');
  const barH = document.getElementById('pos-bar-home');
  const barA = document.getElementById('pos-bar-away');

  if (elHPos) elHPos.textContent = `${hPos}%`;
  if (elAPos) elAPos.textContent = `${aPos}%`;
  if (barH) barH.style.width = `${hPos}%`;
  if (barA) barA.style.width = `${aPos}%`;

  // 2. Rows Data (API မမိသေးပါက Default စမ်းသပ်ဂဏန်းများဖြင့် ဖော်ပြထားမည်)
  const rowConfigs = [
    { key: "expected goals (xg)", label: "xG", defH: "1.15", defA: "0.85" },
    { key: "total shots", label: "Total Shots", defH: "12", defA: "9" },
    { key: "shots on target", label: "Shots on Target", defH: "4", defA: "3" },
    { key: "accurate passes", label: "Passes", defH: "385", defA: "342" },
    { key: "corner kicks", label: "Corners", defH: "5", defA: "4" },
    { key: "goalkeeper saves", label: "Saves", defH: "3", defA: "3" }
  ];

  const listContainer = document.getElementById('stat-items-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  rowConfigs.forEach(cfg => {
    const valH = statsMap[cfg.key]?.home || cfg.defH;
    const valA = statsMap[cfg.key]?.away || cfg.defA;

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
