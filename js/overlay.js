let timerInterval = null;
let baseSeconds = 0;
let isRunning = false;
let startTime = 0;

matchRef.on('value', (snap) => {
  const data = snap.val();
  if (!data) return;
  
  document.getElementById('scoreboard').style.display = 'inline-flex';
  
  // Teams & Scores
  document.getElementById('home-code').textContent = data.homeShort || 'CHE';
  document.getElementById('away-code').textContent = data.awayShort || 'BOU';
  document.getElementById('home-score').textContent = data.homeScore ?? 0;
  document.getElementById('away-score').textContent = data.awayScore ?? 0;
  
  // Colors & Logos
  document.getElementById('home-strip').style.backgroundColor = data.homeColor || '#034694';
  document.getElementById('away-strip').style.backgroundColor = data.awayColor || '#DA291C';
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
  
  // Lineup Tactical Pitch Display
  const lineupPanel = document.getElementById('lineups-panel');
  if (data.showLineup) {
    lineupPanel.classList.add('active');
    
    // Home
    document.getElementById('lu-home-logo').src = `assets/logos/${data.homeKey}.png`;
    document.getElementById('lu-home-name').textContent = data.homeName || 'HOME';
    document.getElementById('lu-home-form').textContent = data.homeFormation || '3-4-2-1';
    buildTacticalPitch('home-pitch-field', data.homeKey, data.homeFormation || '3-4-2-1');
    
    // Away
    document.getElementById('lu-away-logo').src = `assets/logos/${data.awayKey}.png`;
    document.getElementById('lu-away-name').textContent = data.awayName || 'AWAY';
    document.getElementById('lu-away-form').textContent = data.awayFormation || '4-2-3-1';
    buildTacticalPitch('away-pitch-field', data.awayKey, data.awayFormation || '4-2-3-1');
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

// Formation အလိုက် ကွင်းထဲတွင် အလိုအလျောက် အင်္ကျီနေရာချပေးခြင်း
function buildTacticalPitch(containerId, teamKey, formationStr) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  
  // formation string ဥပမာ: "3-4-2-1" -> [3, 4, 2, 1]
  const rows = formationStr.split('-').map(Number);
  
  // Attackers (ထိပ်ဆုံး အတန်း) မှစ၍ Defenders အထိ
  // rows array ကို ပြောင်းပြန်ယူပြီး ထိပ်ဆုံးမှ အောက်သို့ ချပါမည် (Attack -> Mid -> Def -> GK)
  const forwardToBack = [...rows].reverse();
  
  forwardToBack.forEach(count => {
    const rowEl = document.createElement('div');
    rowEl.className = 'pitch-row';
    for (let i = 0; i < count; i++) {
      const img = document.createElement('img');
      img.className = 'jersey-img';
      img.src = `assets/jerseys/${teamKey}.png`;
      img.alt = 'kit';
      rowEl.appendChild(img);
    }
    container.appendChild(rowEl);
  });
  
  // GK Row (အောက်ဆုံးတွင် GK အင်္ကျီ ၁ ထည် အမြဲနေရာယူမည်)
  const gkRow = document.createElement('div');
  gkRow.className = 'pitch-row';
  const gkImg = document.createElement('img');
  gkImg.className = 'jersey-img';
  gkImg.src = `assets/gk/${teamKey}.png`;
  gkImg.alt = 'gk kit';
  gkRow.appendChild(gkImg);
  container.appendChild(gkRow);
}
