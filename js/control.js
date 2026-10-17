const TEAMS = {
  ars: { name: "Arsenal", short: "ARS", color: "#EF0107" },
  avl: { name: "Aston Villa", short: "AVL", color: "#670E36" },
  bha: { name: "Brighton", short: "BHA", color: "#0057B8" },
  bou: { name: "Bournemouth", short: "BOU", color: "#DA291C" },
  bre: { name: "Brentford", short: "BRE", color: "#D20000" },
  che: { name: "Chelsea", short: "CHE", color: "#034694" },
  cov: { name: "Coventry City", short: "COV", color: "#0099D8" },
  cry: { name: "Crystal Palace", short: "CRY", color: "#1B458F" },
  eve: { name: "Everton", short: "EVE", color: "#003399" },
  ful: { name: "Fulham", short: "FUL", color: "#000000" },
  hul: { name: "Hull City", short: "HUL", color: "#F5971E" },
  ips: { name: "Ipswich Town", short: "IPS", color: "#004494" },
  lee: { name: "Leeds United", short: "LEE", color: "#1D428A" },
  liv: { name: "Liverpool", short: "LIV", color: "#C8102E" },
  mci: { name: "Man City", short: "MCI", color: "#6CABDD" },
  mun: { name: "Man United", short: "MUN", color: "#DA291C" },
  new: { name: "Newcastle", short: "NEW", color: "#241F20" },
  nfo: { name: "Nottm Forest", short: "NFO", color: "#DD0000" },
  sun: { name: "Sunderland", short: "SUN", color: "#EB172B" },
  tot: { name: "Tottenham", short: "TOT", color: "#132257" }
};

const FORMATIONS = [
  "4-3-3",
  "4-2-3-1",
  "3-4-2-1",
  "4-4-2",
  "3-5-2",
  "5-3-2",
  "5-2-3",
  "3-4-3",
  "4-1-4-1"
];

let current = {};
let ctrlTimerInterval = null;

// Dropdowns အစပြုခြင်း
function initDropdowns() {
  const hTeam = document.getElementById('home-team-select');
  const aTeam = document.getElementById('away-team-select');
  const hForm = document.getElementById('home-formation-select');
  const aForm = document.getElementById('away-formation-select');

  if (!hTeam || !aTeam || !hForm || !aForm) return;

  hTeam.innerHTML = '';
  aTeam.innerHTML = '';
  hForm.innerHTML = '';
  aForm.innerHTML = '';

  Object.entries(TEAMS).forEach(([key, t]) => {
    hTeam.add(new Option(`${t.short} - ${t.name}`, key));
    aTeam.add(new Option(`${t.short} - ${t.name}`, key));
  });

  FORMATIONS.forEach(f => {
    hForm.add(new Option(f, f));
    aForm.add(new Option(f, f));
  });

  hTeam.value = 'che';
  aTeam.value = 'bou';
  hForm.value = '3-4-2-1';
  aForm.value = '4-2-3-1';
}

initDropdowns();

// Realtime Firebase Listener
matchRef.on('value', (snap) => {
  const data = snap.val();
  if (!data) return;
  current = data;

  // Scoreboard Text & Logos
  document.getElementById('ctrl-h-short').textContent = data.homeShort || 'CHE';
  document.getElementById('ctrl-a-short').textContent = data.awayShort || 'BOU';
  document.getElementById('ctrl-h-score').textContent = data.homeScore ?? 0;
  document.getElementById('ctrl-a-score').textContent = data.awayScore ?? 0;
  document.getElementById('ctrl-h-logo').src = `assets/logos/${data.homeKey || 'che'}.png`;
  document.getElementById('ctrl-a-logo').src = `assets/logos/${data.awayKey || 'bou'}.png`;

  // Selectors Sync
  if (data.homeKey) document.getElementById('home-team-select').value = data.homeKey;
  if (data.awayKey) document.getElementById('away-team-select').value = data.awayKey;
  if (data.homeFormation) document.getElementById('home-formation-select').value = data.homeFormation;
  if (data.awayFormation) document.getElementById('away-formation-select').value = data.awayFormation;

  renderClock();
  clearInterval(ctrlTimerInterval);
  if (data.timer?.isRunning) {
    ctrlTimerInterval = setInterval(renderClock, 1000);
  }
});

// Timer Clock Display
function renderClock() {
  let total = current.timer?.baseSeconds || 0;
  if (current.timer?.isRunning) {
    total += Math.floor((Date.now() - (current.timer?.startTime || Date.now())) / 1000);
  }
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  document.getElementById('ctrl-clock').textContent =
    `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Timer Functions
function startTimer() {
  if (current.timer?.isRunning) return;
  matchRef.child('timer').update({ isRunning: true, startTime: Date.now() });
}

function pauseTimer() {
  if (!current.timer?.isRunning) return;
  const elapsed = Math.floor((Date.now() - current.timer.startTime) / 1000);
  matchRef.child('timer').update({
    isRunning: false,
    baseSeconds: (current.timer.baseSeconds || 0) + elapsed
  });
}

function resetTimer() {
  matchRef.child('timer').update({ isRunning: false, baseSeconds: 0, startTime: Date.now() });
}

function setTimerMin(min) {
  matchRef.child('timer').update({ isRunning: false, baseSeconds: min * 60, startTime: Date.now() });
}

// Custom Minute & Second Edit တိုက်ရိုက်သတ်မှတ်ခြင်း
function applyCustomTime() {
  const minInput = document.getElementById('input-custom-min');
  const secInput = document.getElementById('input-custom-sec');

  const min = parseInt(minInput.value, 10) || 0;
  const sec = parseInt(secInput.value, 10) || 0;
  const totalSeconds = (min * 60) + sec;

  matchRef.child('timer').update({
    baseSeconds: totalSeconds,
    startTime: Date.now()
  });

  // Input Box ထဲရှိ တန်ဖိုးများကို ရှင်းလင်းပေးခြင်း
  minInput.value = '';
  secInput.value = '';
}

// Match Period & Status Functions (1st Half, HT, 2nd Half, FT, 45 Min, 90 Min, Full Time)
function setPeriod(period) {
  matchRef.update({ period });
}

// Score Adjust Functions
function adjustScore(team, val) {
  if (team === 'home') {
    const homeScore = Math.max(0, (current.homeScore || 0) + val);
    matchRef.update({ homeScore });
  } else {
    const awayScore = Math.max(0, (current.awayScore || 0) + val);
    matchRef.update({ awayScore });
  }
}

// Tactical Pitch Overlays Toggle (Show / Hide)
function toggleLineup(show) {
  if (typeof show === 'boolean') {
    matchRef.update({ showLineup: show });
  } else {
    matchRef.update({ showLineup: !current.showLineup });
  }
}

// Bottom Scroll Lineup Ticker Toggle (Show / Hide)
function toggleTicker(show) {
  if (typeof show === 'boolean') {
    matchRef.update({ showTicker: show });
  } else {
    matchRef.update({ showTicker: !current.showTicker });
  }
}

// Save Teams & Formations
function saveTeamsAndFormations() {
  const hKey = document.getElementById('home-team-select').value;
  const aKey = document.getElementById('away-team-select').value;
  const hForm = document.getElementById('home-formation-select').value;
  const aForm = document.getElementById('away-formation-select').value;

  matchRef.update({
    homeKey: hKey,
    homeName: TEAMS[hKey].name,
    homeShort: TEAMS[hKey].short,
    homeColor: TEAMS[hKey].color,
    homeFormation: hForm,

    awayKey: aKey,
    awayName: TEAMS[aKey].name,
    awayShort: TEAMS[aKey].short,
    awayColor: TEAMS[aKey].color,
    awayFormation: aForm
  });
}

// Reset Match Function (Lineup နှင့် Ticker နှစ်ခုလုံး ပြန်လည်အသက်ဝင်စေခြင်း)
function resetAllMatch() {
  if (confirm("ပွဲစဉ်အချက်အလက် အားလုံးကို Reset ပြုလုပ်မှာ သေချာပါသလား?")) {
    matchRef.set({
      homeKey: "che",
      homeName: "Chelsea",
      homeShort: "CHE",
      homeColor: "#034694",
      homeScore: 0,
      homeFormation: "3-4-2-1",

      awayKey: "bou",
      awayName: "Bournemouth",
      awayShort: "BOU",
      awayColor: "#DA291C",
      awayScore: 0,
      awayFormation: "4-2-3-1",

      period: "1st Half",
      showLineup: true,
      showTicker: true,
      timer: {
        baseSeconds: 0,
        isRunning: false,
        startTime: Date.now()
      }
    });
  }
}
