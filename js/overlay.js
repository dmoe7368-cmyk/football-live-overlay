let timerInterval = null;
let baseSeconds = 0;
let isRunning = false;
let startTime = 0;

// Formation အလိုက် ကွင်းလယ်စည်း (Center 49%) ပေါ်တွင် အတိအကျ နေရာချထားမှု
const FORMATION_POSITIONS = {
  // 3-Line Formations: [Forwards 23%, Midfield (Center 49%), Defenders 74%]
  "4-3-3":   [23, 49, 74],
  "4-4-2":   [23, 49, 74],
  "3-4-3":   [23, 49, 74],
  "3-5-2":   [23, 49, 74],
  "5-3-2":   [23, 49, 74],
  "5-2-3":   [23, 49, 74],
  "5-4-1":   [23, 49, 74],

  // 4-Line Formations: [ST 22%, AM 36%, Center Midfield/DM (Center 49%), Def 74%]
  "3-4-2-1": [22, 36, 49, 74],
  "4-2-3-1": [22, 36, 49, 74],
  "3-4-1-2": [22, 36, 49, 74],
  "4-3-2-1": [22, 36, 49, 74],

  // 4-1-4-1: ST (22%), 4 Mid (Center 49%), 1 DMC (62%), 4 Def (74%)
  "4-1-4-1": [22, 49, 62, 74]
};

matchRef.on('value', (snap) => {
  const data = snap.val();
  if (!data) return;

  // Scoreboard Display
  document.getElementById('scoreboard').style.display = 'inline-flex';

  // Teams & Scores
  document.getElementById('home-code').textContent = data.homeShort || 'CRY';
  document.getElementById('away-code').textContent = data.awayShort || 'MCI';
  document.getElementById('home-score').textContent = data.homeScore ?? 0;
  document.getElementById('away-score').textContent = data.awayScore ?? 0;

  // Colors & Logos
  document.getElementById('home-strip').style.backgroundColor = data.homeColor || '#1B458F';
  document.getElementById('away-strip').style.backgroundColor = data.awayColor || '#6CABDD';
  document.getElementById('home-logo').src = `assets/logos/${data.homeKey}.png`;
  document.getElementById('away-logo').src = `assets/logos/${data.awayKey}.png`;

  // Status & Period
  document.getElementById('match-period').textContent = data.period || '1st Half';

  // Timer Sync
  baseSeconds = data.timer?.baseSeconds || 0;
  isRunning = data.timer?.isRunning || false;
  startTime = data.timer?.startTime || Date.now();
  renderTimer();

  clearInterval(timerInterval);
  if (isRunning) {
    timerInterval = setInterval(renderTimer, 1000);
  }

  // Tactical Lineups Display
  const lineupPanel = document.getElementById('lineups-panel');
  if (data.showLineup) {
    lineupPanel.classList.add('active');

    // Home Setup
    document.getElementById('lu-home-logo').src = `assets/logos/${data.homeKey}.png`;
    document.getElementById('lu-home-name').textContent = data.homeName || 'HOME';
    document.getElementById('lu-home-form').textContent = data.homeFormation || '3-4-2-1';
    buildTacticalPitch('home-pitch-players', data.homeKey, data.homeFormation || '3-4-2-1');

    // Away Setup
    document.getElementById('lu-away-logo').src = `assets/logos/${data.awayKey}.png`;
    document.getElementById('lu-away-name').textContent = data.awayName || 'AWAY';
    document.getElementById('lu-away-form').textContent = data.awayFormation || '4-4-2';
    buildTacticalPitch('away-pitch-players', data.awayKey, data.awayFormation || '4-4-2');
  } else {
    lineupPanel.classList.remove('active');
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

// Tactical Positioning Logic
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

  // Attackers -> Midfield -> Defenders အစဉ်အတိုင်း နေရာချထားခြင်း
  forwardToBack.forEach((count, idx) => {
    const rowEl = document.createElement('div');
    // လူဦးရေအလိုက် class (row-1, row-2, row-3, row-4, row-5) သတ်မှတ်ပေးခြင်း
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

  // GK Row (ဂိုးပေါက်ရှေ့ ဂိုးဧရိယာအတွင်း 90% တွင် အမြဲနေရာယူမည်)
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
