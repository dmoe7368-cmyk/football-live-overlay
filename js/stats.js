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

// Firebase မှ showStats နှင့် အသင်းများကို စောင့်ကြည့်နားထောင်ခြင်း
matchRef.on('value', (snap) => {
  const data = snap.val();
  if (!data) return;

  isStatsVisibleByController = (data.showStats === true);
  const panel = document.getElementById('stats-panel');

  // Controller မှ Hide Stats လုပ်ထားပါက ပိတ်မည်
  if (!isStatsVisibleByController) {
    if (panel) panel.style.display = 'none';
    return;
  }

  // Show Stats နှိပ်ထားပါက Frame ကို ချက်ချင်း မျက်နှာပြင်ပေါ် ဖော်ပြမည်
  if (panel) {
    panel.style.display = 'block';
  }

  const hName = FOTMOB_TEAM_NAMES[data.homeKey] || data.homeName || "Home";
  const aName = FOTMOB_TEAM_NAMES[data.awayKey] || data.awayName || "Away";

  // ပွဲစတင်ခြင်း ရှိ/မရှိ စစ်ဆေးပြီး Stats ဆွဲတင်ခြင်း (မစသေးပါက Pre-Match Preview ပြသမည်)
  autoFindAndLoadStats(hName, aName);
});

// FotMob မှ ယနေ့ ပရီးမီးယားလိဂ် ပွဲစဉ်ထဲမှ Match ID ကို ရှာဖွေခြင်း
async function autoFindAndLoadStats(homeTeamName, awayTeamName) {
  try {
    const proxyUrl = "https://corsproxy.io/?";
    const leagueApi = `${proxyUrl}https://www.fotmob.com/api/leagues?id=47`;
    
    const res = await fetch(leagueApi);
    if (!res.ok) throw new Error("League API Proxy Error");
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
      fetchMatchStats(currentStatsMatchId);

      clearInterval(statsFetchTimer);
      statsFetchTimer = setInterval(() => {
        if (isStatsVisibleByController && currentStatsMatchId) {
          fetchMatchStats(currentStatsMatchId);
        }
      }, 45000);
    } else {
      // ပွဲမစသေးပါက Frame မပျောက်ဘဲ Preview Data ပြသပေးခြင်း
      renderPreviewStats(homeTeamName, awayTeamName, "PRE-MATCH");
    }
  } catch (err) {
    console.warn("FotMob Fetching Fallback Mode:", err);
    // API ချိတ်မရလျှင်ပင် Frame ပျောက်မသွားဘဲ Standby အဖြစ် ဆက်လက်ပြသထားခြင်း
    renderPreviewStats(homeTeamName, awayTeamName, "LIVE STATS");
  }
}

// သက်ဆိုင်ရာ Match ID ၏ Stats အချက်အလက်များ ဆွဲထုတ်ပြသခြင်း
async function fetchMatchStats(matchId) {
  try {
    const proxyUrl = "https://corsproxy.io/?";
    const matchApi = `${proxyUrl}https://www.fotmob.com/api/matchDetails?matchId=${matchId}`;

    const res = await fetch(matchApi);
    if (!res.ok) throw new Error("Match Details API Error");
    const data = await res.json();

    const statsData = data?.content?.stats?.Periods?.All?.stats || [];
    if (!statsData.length) {
      // ပွဲကစားနေသော်လည်း Stats မတက်သေးပါက 0-0 အခြေအနေ ပြသခြင်း
      renderPreviewStats("HOME", "AWAY", "LIVE");
      return;
    }

    renderStatsUI(statsData);
  } catch (err) {
    console.warn("Stats Details Fallback:", err);
    renderPreviewStats("HOME", "AWAY", "LIVE");
  }
}

// တိုက်ရိုက် Stats အချက်အလက်များ UI ပေါ် ထည့်သွင်းခြင်း
function renderStatsUI(statsGroups) {
  let statsMap = {};

  statsGroups.forEach(group => {
    (group.stats || []).forEach(item => {
      const title = (item.title || "").toLowerCase();
      const vals = item.stats || [];
      if (vals.length >= 2) {
        statsMap[title] = { home: vals[0], away: vals[1] };
      }
    });
  });

  // 1. Possession
  const pos = statsMap["ball possession"] || { home: "50%", away: "50%" };
  const hPos = parseInt(pos.home) || 50;
  const aPos = parseInt(pos.away) || 50;
  document.getElementById('stat-pos-home').textContent = `${hPos}%`;
  document.getElementById('stat-pos-away').textContent = `${aPos}%`;
  document.getElementById('pos-bar-home').style.width = `${hPos}%`;
  document.getElementById('pos-bar-away').style.width = `${aPos}%`;

  // 2. Rows: xG, Total Shots, Shots on Target, Passes, Corners, Saves
  const rowConfigs = [
    { key: "expected goals (xg)", label: "xG" },
    { key: "total shots", label: "Total Shots" },
    { key: "shots on target", label: "Shots on Target" },
    { key: "accurate passes", label: "Passes" },
    { key: "corner kicks", label: "Corners" },
    { key: "goalkeeper saves", label: "Saves" }
  ];

  const listContainer = document.getElementById('stat-items-list');
  listContainer.innerHTML = '';

  rowConfigs.forEach(cfg => {
    const item = statsMap[cfg.key] || { home: "0", away: "0" };
    const row = document.createElement('div');
    row.className = 'stat-row-item';
    row.innerHTML = `
      <span class="stat-num home">${item.home}</span>
      <span class="stat-title-center">${cfg.label}</span>
      <span class="stat-num away">${item.away}</span>
    `;
    listContainer.appendChild(row);
  });
}

// ပွဲမစမီ သို့မဟုတ် API စောင့်ဆိုင်းနေချိန်တွင် Frame အလွတ်မဖြစ်စေဘဲ စမ်းသပ်ပြသမည့် Function
function renderPreviewStats(homeName, awayName, badgeText = "STANDBY") {
  const badge = document.querySelector('.stats-live-dot');
  if (badge) badge.textContent = badgeText;

  // Default Possession 50-50
  document.getElementById('stat-pos-home').textContent = "50%";
  document.getElementById('stat-pos-away').textContent = "50%";
  document.getElementById('pos-bar-home').style.width = "50%";
  document.getElementById('pos-bar-away').style.width = "50%";

  const previewConfigs = [
    { label: "xG", home: "0.00", away: "0.00" },
    { label: "Total Shots", home: "0", away: "0" },
    { label: "Shots on Target", home: "0", away: "0" },
    { label: "Passes", home: "0", away: "0" },
    { label: "Corners", home: "0", away: "0" },
    { label: "Saves", home: "0", away: "0" }
  ];

  const listContainer = document.getElementById('stat-items-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  previewConfigs.forEach(cfg => {
    const row = document.createElement('div');
    row.className = 'stat-row-item';
    row.innerHTML = `
      <span class="stat-num home">${cfg.home}</span>
      <span class="stat-title-center">${cfg.label}</span>
      <span class="stat-num away">${cfg.away}</span>
    `;
    listContainer.appendChild(row);
  });
}
