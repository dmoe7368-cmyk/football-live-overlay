module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // ၁။ ကစားသမားနှင့် အသင်းအမည်များအတွက် FPL Bootstrap ကို ဆွဲယူခြင်း
    const bootRes = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!bootRes.ok) throw new Error("FPL Bootstrap fetch failed");
    const bootData = await bootRes.json();

    const playerMap = {};
    (bootData.elements || []).forEach(p => {
      playerMap[p.id] = p.web_name;
    });

    const teamMap = {};
    (bootData.teams || []).forEach(t => {
      teamMap[t.id] = { name: t.name, short: t.short_name };
    });

    // ၂။ ပွဲစဉ်များ စာရင်းကို ဆွဲယူခြင်း
    const fixRes = await fetch("https://fantasy.premierleague.com/api/fixtures/", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!fixRes.ok) throw new Error("FPL Fixtures fetch failed");
    const fixtures = await fixRes.json();

    const searchHome = (req.query.home || "lee").toLowerCase();
    const searchAway = (req.query.away || "mun").toLowerCase();

    // သက်ဆိုင်ရာ ပွဲစဉ်ကို ရှာဖွေခြင်း
    let targetFixture = fixtures.find(f => {
      const hTeam = teamMap[f.team_h];
      const aTeam = teamMap[f.team_a];
      if (!hTeam || !aTeam) return false;

      const hName = hTeam.name.toLowerCase();
      const hShort = hTeam.short.toLowerCase();
      const aName = aTeam.name.toLowerCase();
      const aShort = aTeam.short.toLowerCase();

      return (
        (hName.includes(searchHome) || hShort.includes(searchHome)) &&
        (aName.includes(searchAway) || aShort.includes(searchAway))
      ) || (
        (hName.includes(searchAway) || hShort.includes(searchAway)) &&
        (aName.includes(searchHome) || aShort.includes(searchHome))
      );
    });

    // အကယ်၍ ရှာမတွေ့ပါက လတ်တလော ကစားနေသည့် Live ပွဲကို ရွေးထုတ်ခြင်း
    if (!targetFixture) {
      targetFixture = fixtures.find(f => f.started === true && f.finished === false);
    }

    if (!targetFixture) {
      return res.status(404).json({ error: "No live or matching FPL fixture found" });
    }

    const hTeam = teamMap[targetFixture.team_h] || { name: "Home", short: "H" };
    const aTeam = teamMap[targetFixture.team_a] || { name: "Away", short: "A" };

    // FPL Stats စာရင်းထဲမှ ကစားသမားအမည်နှင့် အရေအတွက် ထုတ်ယူသည့် Helper
    const extractStat = (identifier) => {
      const statObj = (targetFixture.stats || []).find(s => s.identifier === identifier);
      if (!statObj) return { homeCount: 0, awayCount: 0, homePlayers: [], awayPlayers: [] };

      let homeCount = 0;
      const homePlayers = [];
      (statObj.h || []).forEach(item => {
        homeCount += item.value;
        const pName = playerMap[item.element] || `Player ${item.element}`;
        homePlayers.push(item.value > 1 ? `${pName} (${item.value})` : pName);
      });

      let awayCount = 0;
      const awayPlayers = [];
      (statObj.a || []).forEach(item => {
        awayCount += item.value;
        const pName = playerMap[item.element] || `Player ${item.element}`;
        awayPlayers.push(item.value > 1 ? `${pName} (${item.value})` : pName);
      });

      return { homeCount, awayCount, homePlayers, awayPlayers };
    };

    // BPS (Fantasy Performance Points စုစုပေါင်း တွက်ချက်ခြင်း)
    let homeBps = 0;
    let awayBps = 0;
    const bpsObj = (targetFixture.stats || []).find(s => s.identifier === "bps");
    (bpsObj?.h || []).forEach(i => homeBps += i.value);
    (bpsObj?.a || []).forEach(i => awayBps += i.value);

    return res.status(200).json({
      homeTeam: hTeam.name,
      awayTeam: aTeam.name,
      goals: extractStat("goals_scored"),
      assists: extractStat("assists"),
      yellowCards: extractStat("yellow_cards"),
      redCards: extractStat("red_cards"),
      saves: extractStat("saves"),
      bps: { home: homeBps, away: awayBps }
    });

  } catch (error) {
    console.error("FPL Fetch Error:", error);
    return res.status(500).json({ error: "Failed to fetch FPL data", details: error.message });
  }
};
