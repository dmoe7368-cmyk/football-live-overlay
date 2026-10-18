let timerInterval = null;
let baseSeconds = 0;
let isRunning = false;
let startTime = 0;

const FORMATION_POSITIONS = {
  "4-3-3":   [23, 49, 74],
  "4-4-2":   [23, 49, 74],
  "3-4-3":   [23, 49, 74],
  "3-5-2":   [23, 49, 74],
  "5-3-2":   [23, 49, 74],
  "5-2-3":   [23, 49, 74],
  "5-4-1":   [23, 49, 74],
  "3-4-2-1": [22, 36, 49, 74],
  "4-2-3-1": [22, 36, 49, 74],
  "3-4-1-2": [22, 36, 49, 74],
  "4-3-2-1": [22, 36, 49, 74],
  "4-1-4-1": [22, 49, 62, 74]
};

matchRef.on('value', (snap) => {
  const data = snap.val();
  if (!data) return;

  // 1. Scoreboard Display
  document.getElementById('scoreboard').style.display = 'inline-flex';
  document.getElementById('home-code').textContent = data.homeShort || 'BRE';
  document.getElementById('away-code').textContent = data.awayShort || 'LIV';
  document.getElementById('home-score').textContent = data.homeScore ?? 0;
  document.getElementById('away-score').textContent = data.awayScore ?? 0;

  document.getElementById('home-logo').src = `assets/logos/${data.homeKey || 'bre'}.png`;
  document.getElementById('away-logo').src = `assets/logos/${data.awayKey || 'liv'}.png`;

  // Status & Period Check (HT / FT ဖြစ်လျှင် မိနစ်ဖျောက်ပြီး စာတန်းသာ ပြသခြင်း)
  const currentPeriod = (data.period || '1st Half').trim();
  const periodEl = document.getElementById('match-period');
  const clockBadgeEl = document.querySelector('.clock-badge');
  periodEl.textContent = currentPeriod;

  const isStopStatus = ['HT', 'HALF TIME', 'FT', 'FULL TIME'].includes(currentPeriod.toUpperCase());
  if (isStopStatus) {
    clockBadgeEl.classList.add('status-only');
  } else {
    clockBadgeEl.classList.remove('status-only');
  }

  // 2. Timer Sync
  baseSeconds = data.timer?.baseSeconds || 0;
  isRunning = data.timer?.isRunning || false;
  startTime = data.timer?.startTime || Date.now();
  renderTimer();

  clearInterval(timerInterval);
  if (isRunning) {
    timerInterval = setInterval(renderTimer, 1000);
  }

  // 3. Tactical Pitch Lineups
  const lineupPanel = document.getElementById('lineups-panel');
  if (data.showLineup) {
    lineupPanel.classList.add('active');

    document.getElementById('lu-home-logo').src = `assets/logos/${data.homeKey || 'bre'}.png`;
    document.getElementById('lu-home-name').textContent = data.homeName || 'BRENTFORD';
    document.getElementById('lu-home-form').textContent = data.homeFormation || '4-2-3-1';
    buildTacticalPitch('home-pitch-players', data.homeKey || 'bre', data.homeFormation || '4-2-3-1');

    document.getElementById('lu-away-logo').src = `assets/logos/${data.awayKey || 'liv'}.png`;
    document.getElementById('lu-away-name').textContent = data.awayName || 'LIVERPOOL';
    document.getElementById('lu-away-form').textContent = data.awayFormation || '4-2-3-1';
    buildTacticalPitch('away-pitch-players', data.awayKey || 'liv', data.awayFormation || '4-2-3-1');
  } else {
    lineupPanel.classList.remove('active');
  }

  // 4. Lineup Scroll Ticker
  const tickerBar = document.getElementById('lineup-ticker');
  if (tickerBar) {
    if (data.showTicker !== false) {
      tickerBar.style.display = 'flex';
      renderLineupTicker(data.homeKey || 'bre', data.awayKey || 'liv');
    } else {
      tickerBar.style.display = 'none';
    }
  }
});

function renderTimer() {
  let total = baseSeconds;
  if (isRunning) {
    total += Math.floor((Date.now() - startTime) / 1000);
  }
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  document.getElementById('match-clock').textContent =
    `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function buildTacticalPitch(playersContainerId, teamKey, formationStr) {
  const container = document.getElementById(playersContainerId);
  if (!container) return;
  container.innerHTML = '';

  const rows = formationStr.split('-').map(Number);
  const forwardToBack = [...rows].reverse();

  const yPositions = FORMATION_POSITIONS[formationStr] || (
    rows.length === 3 ? [23, 49, 74] :
    rows.length === 4 ? [22, 36, 49, 74] :
    [20, 35, 49, 63, 76]
  );

  forwardToBack.forEach((count, idx) => {
    const rowEl = document.createElement('div');
    rowEl.className = `pitch-row row-${Math.min(count, 5)}`;
    rowEl.style.top = `${yPositions[idx]}%`;

    for (let i = 0; i < count; i++) {
      const img = document.createElement('img');
      img.className = 'jersey-img';
      img.src = `assets/jerseys/${teamKey}.png`;
      img.alt = 'kit';
      rowEl.appendChild(img);
    }
    container.appendChild(rowEl);
  });

  const gkRow = document.createElement('div');
  gkRow.className = 'pitch-row row-1';
  gkRow.style.top = '90%';
  const gkImg = document.createElement('img');
  gkImg.className = 'jersey-img';
  gkImg.src = `assets/gk/${teamKey}.png`;
  gkImg.alt = 'gk kit';
  gkRow.appendChild(gkImg);
  container.appendChild(gkRow);
}

// Lineup Scroll Ticker (GK, DEF, MID, FWD အလိုအလျောက် ခွဲထုတ်ပြသခြင်း)
function renderLineupTicker(homeKey, awayKey) {
  const tickerTextEl = document.getElementById('ticker-text');
  if (!tickerTextEl) return;

  const dataSource = (typeof CURRENT_MATCH_LINEUPS !== 'undefined') ? CURRENT_MATCH_LINEUPS : (window.CURRENT_MATCH_LINEUPS || {});
  const hTeam = dataSource[homeKey] || { name: homeKey.toUpperCase() };
  const aTeam = dataSource[awayKey] || { name: awayKey.toUpperCase() };

  function formatTeamLineup(team) {
    if (!team) return "Lineup TBA";
    let parts = [];

    // ၁။ အကယ်၍ gk, def, mid, fwd သီးသန့် ခွဲထားပါက
    if (team.gk && team.gk.length) parts.push(`<span class="pos-tag pos-gk">GK</span> ${team.gk.join(', ')}`);
    if (team.def && team.def.length) parts.push(`<span class="pos-tag pos-def">DEF</span> ${team.def.join(', ')}`);
    if (team.mid && team.mid.length) parts.push(`<span class="pos-tag pos-mid">MID</span> ${team.mid.join(', ')}`);
    if (team.fwd && team.fwd.length) parts.push(`<span class="pos-tag pos-fwd">FWD</span> ${team.fwd.join(', ')}`);

    // ၂။ အကယ်၍ lineup: [...] တစ်စုတည်း ရေးထားပါက (မပျောက်သွားစေရန် အလိုအလျောက် ပြသပေးခြင်း)
    if (parts.length === 0 && team.lineup && team.lineup.length) {
      parts.push(team.lineup.join(' &nbsp;•&nbsp; '));
    }

    // နည်းပြ (Coach)
    if (team.manager) {
      parts.push(`<span style="color:#76d400; font-weight:800; margin-left:8px;">[Coach: ${team.manager}]</span>`);
    }

    return parts.length ? parts.join(' &nbsp;&nbsp;•&nbsp;&nbsp; ') : "Lineup TBA";
  }

  const hHtml = formatTeamLineup(hTeam);
  const aHtml = formatTeamLineup(aTeam);

  const fullContent = `
    <span style="color:#76d400; font-weight:900;">[ ${hTeam.name.toUpperCase()} ]</span> ${hHtml}
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    <span style="color:#38bdf8; font-weight:900;">[ ${aTeam.name.toUpperCase()} ]</span> ${aHtml}
  `;

  tickerTextEl.innerHTML = `${fullContent} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${fullContent}`;
}
