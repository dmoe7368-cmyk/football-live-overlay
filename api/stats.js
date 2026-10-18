module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const targetId = req.query.id || req.query.matchId;

  if (!targetId) {
    return res.status(400).json({ error: "Match ID is required" });
  }

  // FotMob Mobile App Endpoint နှင့် Web Endpoint နှစ်မျိုးလုံး ချိတ်ဆက်မည့် လမ်းကြောင်းများ
  const targetUrls = [
    `https://pub.fotmob.com/prod/pub/api/v2/matchDetails?matchId=${targetId}`,
    `https://www.fotmob.com/api/matchDetails?matchId=${targetId}`
  ];

  for (const url of targetUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
          "Accept": "application/json",
          "Cache-Control": "no-cache"
        }
      });

      if (response.ok) {
        const data = await response.json();
        return res.status(200).json(data);
      }
    } catch (e) {
      console.warn("Retrying next endpoint...", e);
    }
  }

  return res.status(500).json({ error: "Failed to fetch from FotMob endpoints" });
};
