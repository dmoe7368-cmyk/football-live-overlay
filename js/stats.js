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

  if (!isStatsVisibleByController) {
    if (panel) panel.style.display = 'none';
    return;
  }

  // အသင်း ပြောင်းလဲသွားပါက Match ID အသစ် အလိုအလျောက် ရှာရန်
  const hName = FOTMOB_TEAM_NAMES[data.homeKey] || data.homeName;
  const aName = FOTMOB_TEAM_NAMES[data.awayKey] || data.awayName;

  autoFindAndLoadStats(hName, aName);
});

// FotMob မှ ယနေ့ ပရီးမီးယားလိဂ် ပွဲစဉ်ထဲမှ သက်ဆိုင်ရာ Match ID ကို Auto ရှာဖွေခြင်း
async function autoFindAndLoadStats(homeTeamName, awayTeamName) {
  try {
    // Premier League FotMob League ID = 47
    const proxyUrl = "https://corsproxy.io/?";
    const leagueApi = `${proxyUrl}https://www.fotmob.com/api/leagues?id=47`;
    
    const res = await fetch(leagueApi);
    if (!res.ok) throw new Error("League API Error");
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

      // ၄၅ စက္ကန့်တစ်ကြိမ် Auto Refresh ပြုလုပ်ခြင်း
      clearInterval(statsFetchTimer);
      statsFetchTimer = setInterval(() => {
        if (isStatsVisibleByController && currentStatsMatchId) {
          fetchMatchStats(currentStatsMatchId);
        }
      }, 45000);
    } else {
      throw new Error("Match not found currently in live list");
    }
  } catch (err) {
    console.warn("FotMob Auto-Find Error (Auto Hiding Stats):", err);
    // API Error ဖြစ်ပါက Frame မပျက်စီးစေရန် အလိုအလျောက် ဖျောက်ထားခြင်း
    hideStatsOnError();
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
      hideStatsOnError();
      return;
    }

    renderStatsUI(statsData);

    // Controller က ဖွင့်ထားပြီး အချက်အလက်ရရှိပါက ပြသခြင်း
    if (isStatsVisibleByController) {
      document.getElementById('stats-panel').style.display = 'block';
    }
  } catch (err) {
    console.warn("Stats Details Fetch Error:", err);
    hideStatsOnError();
  }
}

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
    const item = statsMap[cfg.key] || { home: "-", away: "-" };
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

function hideStatsOnError() {
  const panel = document.getElementById('stats-panel');
  if (panel) panel.style.display = 'none';
}
