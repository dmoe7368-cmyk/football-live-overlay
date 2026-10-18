module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // id သို့မဟုတ် matchId နှစ်မျိုးလုံးကို လက်ခံခြင်း
  const targetId = req.query.id || req.query.matchId;

  if (!targetId) {
    return res.status(400).json({ error: "Match ID is required (e.g. ?id=5795480)" });
  }

  try {
    // FotMob Endpoint သည် ?id= ဖြစ်ပါသည်
    const fotmobUrl = `https://www.fotmob.com/api/matchDetails?id=${targetId}`;
    
    const response = await fetch(fotmobUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://www.fotmob.com/",
        "Cache-Control": "no-cache"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `FotMob returned ${response.status}`, url: fotmobUrl });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: "Serverless Fetch Error", details: error.message });
  }
};
