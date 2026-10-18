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
  renderFirstHalfStats();
});

// Leeds vs Man United (1st Half) တကယ့် Live ဂဏန်းများ
function renderFirstHalfStats() {
  const badge = document.querySelector('.stats-live-dot');
  if (badge) badge.textContent = "HT STATS";

  // 1. Possession (Leeds 61% - Man Utd 39%)
  const hPos = 61;
  const aPos = 39;
  
  const elHPos = document.getElementById('stat-pos-home');
  const elAPos = document.getElementById('stat-pos-away');
  const barH = document.getElementById('pos-bar-home');
  const barA = document.getElementById('pos-bar-away');

  if (elHPos) elHPos.textContent = `${hPos}%`;
  if (elAPos) elAPos.textContent = `${aPos}%`;
  if (barH) barH.style.width = `${hPos}%`;
  if (barA) barA.style.width = `${aPos}%`;

  // 2. First Half Match Stats Rows
  const matchStatsList = [
    { label: "xG", home: "0.18", away: "0.64" },
    { label: "Total Shots", home: "3", away: "5" },
    { label: "Shots on Target", home: "1", away: "2" },
    { label: "Accurate Passes", home: "214 (84%)", away: "138 (76%)" },
    { label: "Corners", home: "2", away: "3" },
    { label: "Fouls", home: "7", away: "5" },
    { label: "Saves", home: "1", away: "1" }
  ];

  const listContainer = document.getElementById('stat-items-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  matchStatsList.forEach(cfg => {
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
