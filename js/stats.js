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

  // စက္ကန့် ၂၅ တစ်ကြိမ် Auto Live Update
  clearInterval(statsFetchTimer);
  statsFetchTimer = setInterval(() => {
    if (isStatsVisibleByController) {
      fetchFPLMatchEvents(homeKey, awayKey);
    }
  }, 25000);
});

// Vercel FPL API ဆီသို့ လှမ်းခေါ်ခြင်း
async function fetchFPLMatchEvents(homeKey, awayKey) {
  try {
    const res = await fetch(`/api/stats?home=${homeKey}&away=${awayKey}`);
    if (!res.ok) throw new Error("FPL API response error");

    const data = await res.json();
    renderFPLEventsUI(data);
  } catch (err) {
    console.warn("FPL fetch error:", err);
  }
}

// Stats UI တွင် FPL Events (ဂိုး၊ ကတ်၊ Saves) များ ပြသခြင်း
function renderFPLEventsUI(data) {
  const badge = document.querySelector('.stats-live-dot');
  if (badge) badge.textContent = "FPL LIVE";

  // ၁။ ထိပ်ဆုံး Bar (BPS Performance အချိုးအစား)
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

  // Title ကို BPS POINTS ဟု ပြောင်းခြင်း
  const posTitle = document.querySelector('.possession-title') || document.querySelector('.stat-title-center');
  if (posTitle && posTitle.textContent.includes("POSSESSION")) {
    posTitle.textContent = "PERFORMANCE (BPS)";
  }

  if (elHPos) elHPos.textContent = `${hBps}`;
  if (elAPos) elAPos.textContent = `${aBps}`;
  if (barH) barH.style.width = `${hPct}%`;
  if (barA) barA.style.width = `${aPct}%`;

  // ၂။ Match Events စာရင်း (ဂိုးသွင်းသူ၊ ကတ်ပြခံရသူ နာမည်များ ပါဝင်သည်)
  const formatVal = (statObj) => {
    const count = statObj?.count || 0;
    const players = statObj?.players || [];
    if (players.length > 0) {
      return `${count} (${players.join(', ')})`;
    }
    return `${count}`;
  };

  const eventRows = [
    {
      label: "Goals",
      home: formatVal({ count: data?.goals?.homeCount, players: data?.goals?.homePlayers }),
      away: formatVal({ count: data?.goals?.awayCount, players: data?.goals?.awayPlayers })
    },
    {
      label: "Assists",
      home: formatVal({ count: data?.assists?.homeCount, players: data?.assists?.homePlayers }),
      away: formatVal({ count: data?.assists?.awayCount, players: data?.assists?.awayPlayers })
    },
    {
      label: "Yellow Cards",
      home: formatVal({ count: data?.yellowCards?.homeCount, players: data?.yellowCards?.homePlayers }),
      away: formatVal({ count: data?.yellowCards?.awayCount, players: data?.yellowCards?.awayPlayers })
    },
    {
      label: "Red Cards",
      home: formatVal({ count: data?.redCards?.homeCount, players: data?.redCards?.homePlayers }),
      away: formatVal({ count: data?.redCards?.awayCount, players: data?.redCards?.awayPlayers })
    },
    {
      label: "Saves",
      home: `${data?.saves?.homeCount || 0}`,
      away: `${data?.saves?.awayCount || 0}`
    }
  ];

  const listContainer = document.getElementById('stat-items-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  eventRows.forEach(cfg => {
    const row = document.createElement('div');
    row.className = 'stat-row-item';
    row.innerHTML = `
      <span class="stat-num home" style="font-size: 11px;">${cfg.home}</span>
      <span class="stat-title-center">${cfg.label}</span>
      <span class="stat-num away" style="font-size: 11px;">${cfg.away}</span>
    `;
    listContainer.appendChild(row);
  });
}
