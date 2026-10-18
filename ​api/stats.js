export default async function handler(req, res) {
  // CORS ခွင့်ပြုချက် ပေးခြင်း (မည်သည့်နေရာကမဆို လှမ်းခေါ်နိုင်ရန်)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // URL Query ထဲမှ matchId ကို ယူခြင်း (ဥပမာ ?matchId=5795480)
  const { matchId } = req.query;

  if (!matchId) {
    return res.status(400).json({ error: "matchId is required" });
  }

  try {
    // FotMob က Block မလုပ်စေရန် Real Browser Header များ ထည့်သွင်းခြင်း
    const fotmobUrl = `https://www.fotmob.com/api/matchDetails?matchId=${matchId}`;
    
    const response = await fetch(fotmobUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://www.fotmob.com/",
        "Cache-Control": "no-cache"
      }
    });

    if (!response.ok) {
      throw new Error(`FotMob responded with status ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error("Vercel Proxy Error:", error);
    return res.status(500).json({ error: "Failed to fetch FotMob data", details: error.message });
  }
}
