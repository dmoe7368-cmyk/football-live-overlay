let timerInterval = null;
let baseSeconds = 0;
let isRunning = false;
let startTime = 0;

// အသင်း ၂၀ ၏ Starting XI Lineup Data (Scroll Ticker တွင် ဖော်ပြရန်)
const TEAMS_LINEUP = {
  ars: { name: "Arsenal", lineup: ["Raya(GK)", "Calafiori", "Gabriel", "Konsa", "White", "Lewis-Skelly", "Rice", "Madueke", "Ødegaard", "Saka", "Havertz"] },
  avl: { name: "Aston Villa", lineup: ["Suzuki(GK)", "Ruggeri", "Mings", "Lindelöf", "Wan-Bissaka", "Gomes", "Kamara", "Buendía", "Manzambi", "McGinn", "Jackson"] },
  bou: { name: "Bournemouth", lineup: ["Petrović(GK)", "Truffert", "Silva", "Hill", "Smith", "Scott", "Adams", "Tavernier", "Christie", "Rayan", "Evanilson"] },
  bre: { name: "Brentford", lineup: ["Kelleher(GK)", "Lewis-Potter", "Ajer", "Schuster", "Kayode", "Janelt", "Yarmoliuk", "Schade", "Damsgaard", "Anthony", "Thiago"] },
  bha: { name: "Brighton", lineup: ["Verbruggen(GK)", "Boscagli", "Struijk", "Vušković", "Kadıoğlu", "Ayari", "Andrés", "De Cuyper", "Groß", "Gómez", "Kostoulas"] },
  che: { name: "Chelsea", lineup: ["Martínez(GK)", "Colwill", "Lacroix", "Fofana", "Chavarría", "Barco", "Henderson", "Neto", "Rogers", "Palmer", "Welbeck"] },
  cov: { name: "Coventry City", lineup: ["Rushworth(GK)", "Pinnock", "Thomas", "Mfuni", "Dasilva", "Grimes", "Onyeka", "Yirenkyi", "Mason-Clark", "Thomas-Asante", "Rudoni"] },
  cry: { name: "Crystal Palace", lineup: ["Benítez(GK)", "Canvot", "Tomiyasu", "Richards", "Mitchell", "Wharton", "Timber", "Khalaili", "Pino", "Kamada", "Strand Larsen"] },
  eve: { name: "Everton", lineup: ["Pickford(GK)", "Mykolenko", "Branthwaite", "Tarkowski", "Maitland-Niles", "Garner", "Armstrong", "Grealish", "Dewsbury-Hall", "Johnson", "Barry"] },
  ful: { name: "Fulham", lineup: ["Leno(GK)", "Robinson", "Bassey", "Affengruber", "Castagne", "Charles", "Berge", "Iwobi", "King", "Bobb", "García"] },
  hul: { name: "Hull City", lineup: ["Tzolakis(GK)", "Giles", "Herrington", "Egan", "Ajayi", "Coyle", "Thomas", "Crooks", "Slater", "Belloumi", "McBurnie"] },
  ips: { name: "Ipswich Town", lineup: ["Walton(GK)", "Davis", "O'Shea", "Diop", "Ouattara", "Palacios", "Lukić", "Clarke", "Enciso", "Fatawu", "Emersonn"] },
  lee: { name: "Leeds United", lineup: ["Trafford(GK)", "Muharemović", "Elvedi", "Justin", "Gudmundsson", "Tanaka", "Ampadu", "Stach", "Bogle", "Okafor", "Calvert-Lewin"] },
  liv: { name: "Liverpool", lineup: ["Alisson(GK)", "Kerkez", "van Dijk", "Jacquet", "Araujo", "Mac Allister", "Szoboszlai", "Barcola", "Wirtz", "Gakpo", "Isak"] },
  mci: { name: "Man City", lineup: ["Donnarumma(GK)", "Gvardiol", "Guéhi", "Dias", "Nunes", "Anderson", "Fernández", "Semenyo", "Cherki", "Ndiaye", "Haaland"] },
  mun: { name: "Man United", lineup: ["Lammens(GK)", "Shaw", "Martínez", "Maguire", "Dalot", "Mainoo", "Tielemans", "Rashford", "Fernandes", "Mbeumo", "Cunha"] },
  new: { name: "Newcastle", lineup: ["Hornícek(GK)", "Hall", "Botman", "Thiaw", "Miley", "Steur", "Barnes", "Willock", "Wissa", "Murphy", "Fernandez-Pardo"] },
  nfo: { name: "Nottm Forest", lineup: ["Sels(GK)", "Murillo", "Diomande", "Cunha", "Williams", "McAtee", "Schlager", "Muñoz", "Gibbs-White", "Ndoye", "Delap"] },
  tot: { name: "Tottenham", lineup: ["Kinský(GK)", "Robertson", "Van de Ven", "van Hecke", "Porro", "Tonali", "Bentancur", "Marmoush", "Fernandes", "Sávio", "Solanke"] },
  sun: { name: "Sunderland", lineup: ["Roefs(GK)", "Méthalie", "Ballard", "Danso", "Mukiele", "Sadiki", "Xhaka", "Angulo", "Le Fée", "Meunier", "Brobbey"] }
};

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

// Firebase Realtime Listener
matchRef.on('value', (snap) => {
  const data = snap.val();
  if (!data) return;

  // 1. Scoreboard Display
  document.getElementById('scoreboard').style.display = 'inline-flex';

  // Teams & Scores
  document.getElementById('home-code').textContent = data.homeShort || 'CRY';
  document.getElementById('away-code').textContent = data.awayShort || 'MCI';
  document.getElementById('home-score').textContent = data.homeScore ?? 0;
  document.getElementById('away-score').textContent = data.awayScore ?? 0;

  // Colors & Logos
  document.getElementById('home-strip').style.backgroundColor = data.homeColor || '#1B458F';
  document.getElementById('away-strip').style.backgroundColor = data.awayColor || '#6CABDD';
  document.getElementById('home-logo').src = `assets/logos/${data.homeKey || 'cry'}.png`;
  document.getElementById('away-logo').src = `assets/logos/${data.awayKey || 'mci'}.png`;

  // Status & Period (1st Half, HT, 2nd Half, FT, 45 Min, 90 Min, Full Time)
  document.getElementById('match-period').textContent = data.period || '1st Half';

  // 2. Timer Sync
  baseSeconds = data.timer?.baseSeconds || 0;
  isRunning = data.timer?.isRunning || false;
  startTime = data.timer?.startTime || Date.now();
  renderTimer();

  clearInterval(timerInterval);
  if (isRunning) {
    timerInterval = setInterval(renderTimer, 1000);
  }

  // 3. Tactical Lineups Display (Left & Right Pitches)
  const lineupPanel = document.getElementById('lineups-panel');
  if (data.showLineup) {
    lineupPanel.classList.add('active');

    // Home Setup
    document.getElementById('lu-home-logo').src = `assets/logos/${data.homeKey || 'che'}.png`;
    document.getElementById('lu-home-name').textContent = data.homeName || 'HOME';
    document.getElementById('lu-home-form').textContent = data.homeFormation || '3-4-2-1';
    buildTacticalPitch('home-pitch-players', data.homeKey || 'che', data.homeFormation || '3-4-2-1');

    // Away Setup
    document.getElementById('lu-away-logo').src = `assets/logos/${data.awayKey || 'bou'}.png`;
    document.getElementById('lu-away-name').textContent = data.awayName || 'AWAY';
    document.getElementById('lu-away-form').textContent = data.awayFormation || '4-2-3-1';
    buildTacticalPitch('away-pitch-players', data.awayKey || 'bou', data.awayFormation || '4-2-3-1');
  } else {
    lineupPanel.classList.remove('active');
  }

  // 4. Bottom Lineup Running Ticker Sync
  const tickerBar = document.getElementById('lineup-ticker');
  if (tickerBar) {
    if (data.showTicker !== false) {
      tickerBar.style.display = 'flex';
      renderLineupTicker(data.homeKey || 'che', data.awayKey || 'bou');
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

// Tactical Pitch Positioning Logic (Jersey ဝိုင်းလေးများသာ ဖော်ပြခြင်း)
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

  // GK Row (ဂိုးပေါက်ရှေ့ 90% တွင် အမြဲနေရာယူမည်)
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

// Bottom Lineup Scroll Ticker စာတန်းပြေး ရေးဆွဲခြင်း
function renderLineupTicker(homeKey, awayKey) {
  const tickerTextEl = document.getElementById('ticker-text');
  if (!tickerTextEl) return;

  const hTeam = TEAMS_LINEUP[homeKey] || { name: homeKey.toUpperCase(), lineup: [] };
  const aTeam = TEAMS_LINEUP[awayKey] || { name: awayKey.toUpperCase(), lineup: [] };

  const hList = hTeam.lineup.join(' • ');
  const aList = aTeam.lineup.join(' • ');

  const tickerHtml = `<span style="color:#facc15; font-weight:900;">[ ${hTeam.name.toUpperCase()} ]</span> ${hList} &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp; <span style="color:#38bdf8; font-weight:900;">[ ${aTeam.name.toUpperCase()} ]</span> ${aList}`;

  // စာတန်းပြေးချောမွေ့စေရန် အဆက်မပြတ် ၂ ကြိမ် ထည့်သွင်းပေးခြင်း
  tickerTextEl.innerHTML = `${tickerHtml} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${tickerHtml}`;
}
