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

  const homeKey = data.homeKey || "lee";
  const awayKey = data.awayKey || "mun";

  // ၁ ကြိမ် ချက်ချင်း ဆွဲယူမည်
  fetchFPLMatchEvents(homeKey, awayKey);

  // စက္ကန့် ၂၀ တစ်ကြိမ် အလိုအလျောက် Live Update လုပ်မည်
  clearInterval(statsFetchTimer);
  statsFetchTimer = setInterval(() => {
    if (isStatsVisibleByController) {
      fetchFPLMatchEvents(homeKey, awayKey);
    }
  }, 20000);
});

// Vercel API ဆီသို့ လှမ်းခေါ်ခြင်း
async function fetchFPLMatchEvents(homeKey, awayKey) {
  try {
    const res = await fetch(`/api/stats?home=${homeKey}&away=${awayKey}`);
    if (!res.ok) throw new Error("FPL API error");

    const data = await res.json();
    renderFPLEventsUI(data);
  } catch (err) {
    console.warn("FPL fetch error:", err);
  }
}

// Stats UI တွင် Icon များဖြင့် Event ပြသခြင်း
function renderFPLEventsUI(data) {
  // ၁။ Badge စာသားကို LIVE ဟုသာ ပြသခြင်း
  const badge = document.querySelector('.stats-live-dot');
  if (badge) badge.textContent = "LIVE";

  // ၂။ BPS Performance Bar
  const hBps = data?.bps?.home || 0;
  const aBps = data?.bps?.away || 0;
  const totalBps = hBps + aBps;

  let hPct = 50;
  let aPct = 50;
  if (totalBps > 0) {
    hPct = Math.round((hBps / totalBps) * 100);
    aPct = 100 - hPct;
  }

  const elHPos = document.getElementById('stat-pos-home');
  const elAPos = document.getElementById('stat-pos-away');
  const barH = document.getElementById('pos-bar-home');
  const barA = document.getElementById('pos-bar-away');

  const posTitle = document.querySelector('.stat-name');
  if (posTitle) posTitle.textContent = "BPS POINTS";

  if (elHPos) elHPos.textContent = `${hBps}`;
  if (elAPos) elAPos.textContent = `${aBps}`;
  if (barH) barH.style.width = `${hPct}%`;
  if (barA) barA.style.width = `${aPct}%`;

  // '1' ဂဏန်းများ မပါစေဘဲ ကစားသမား အမည်သီးသန့်သာ ထုတ်ယူသည့် Helper
  const formatPlayers = (players) => {
    if (!players || players.length === 0) return "-";
    // ကစားသမားအမည်များတွင် ဂဏန်းများ ကပ်ပါနေပါက ဖယ်ရှားသန့်စင်ခြင်း
    const names = players.map(p => {
      return p.replace(/^\d+\s*\(/, '').replace(/\)\s*$/, '').replace(/\s*\(\d+\)/, '').trim();
    });
    return names.join(', ');
  };

  // ၃။ Icon များဖြင့် အလယ်ခေါင်းစဉ် နေရာချထားခြင်း
  const eventRows = [
    {
      centerHtml: `⚽ GOALS`,
      home: formatPlayers(data?.goals?.homePlayers),
      away: formatPlayers(data?.goals?.awayPlayers)
    },
    {
      centerHtml: `👟 ASSISTS`,
      home: formatPlayers(data?.assists?.homePlayers),
      away: formatPlayers(data?.assists?.awayPlayers)
    },
    {
      centerHtml: `<span style="display:inline-block;width:9px;height:12px;background:#facc15;border-radius:2px;vertical-align:middle;margin-right:2px;"></span> YELLOW`,
      home: formatPlayers(data?.yellowCards?.homePlayers),
      away: formatPlayers(data?.yellowCards?.awayPlayers)
    },
    {
      centerHtml: `<span style="display:inline-block;width:9px;height:12px;background:#ef4444;border-radius:2px;vertical-align:middle;margin-right:2px;"></span> RED`,
      home: formatPlayers(data?.redCards?.homePlayers),
      away: formatPlayers(data?.redCards?.awayPlayers)
    },
    {
      centerHtml: `🧤 SAVES`,
      home: `${data?.saves?.homeCount ?? 0}`,
      away: `${data?.saves?.awayCount ?? 0}`
    }
  ];

  const listContainer = document.getElementById('stat-items-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  eventRows.forEach(cfg => {
    const row = document.createElement('div');
    row.className = 'stat-row-item';
    row.innerHTML = `
      <span class="stat-num home" style="font-size: 11px; flex: 1; text-align: left; line-height: 1.25;">${cfg.home}</span>
      <span class="stat-title-center" style="min-width: 80px; text-align: center; font-size: 10px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 3px;">
        ${cfg.centerHtml}
      </span>
      <span class="stat-num away" style="font-size: 11px; flex: 1; text-align: right; line-height: 1.25;">${cfg.away}</span>
    `;
    listContainer.appendChild(row);
  });
}
