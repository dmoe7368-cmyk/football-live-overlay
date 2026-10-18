module.exports = async (req, res) => {
  // CORS ခွင့်ပြုချက် အားလုံး ဖွင့်ပေးခြင်း
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { matchId } = req.query;

  if (!matchId) {
    return res.status(400).json({ error: "matchId is required" });
  }

  try {
    const fotmobUrl = `https://www.fotmob.com/api/matchDetails?matchId=${matchId}`;
    
    // FotMob မပိတ်စေရန် Browser Header များ ထည့်သွင်းခြင်း
    const response = await fetch(fotmobUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://www.fotmob.com/",
        "Cache-Control": "no-cache"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `FotMob returned ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: "Serverless Fetch Error", details: error.message });
  }
};
