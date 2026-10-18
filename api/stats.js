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

  const rawUrl = `https://www.fotmob.com/api/matchDetails?matchId=${targetId}`;

  // Vercel IP Block မဖြစ်စေရန် ပြင်ပ Cloudflare Bypass Proxy များမှတစ်ဆင့် လှမ်းဆွဲခြင်း
  const proxyEndpoints = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(rawUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(rawUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rawUrl)}`
  ];

  for (const pUrl of proxyEndpoints) {
    try {
      const response = await fetch(pUrl, {
        headers: {
          "Accept": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        return res.status(200).json(data);
      }
    } catch (e) {
      // Proxy တစ်ခု မရပါက နောက်တစ်ခုသို့ ဆက်လက်ကြိုးစားမည်
    }
  }

  return res.status(500).json({ 
    error: "All proxy endpoints failed", 
    matchId: targetId 
  });
};
