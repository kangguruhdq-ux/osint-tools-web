async function testApis() {
  console.log("Testing Public APIs for Media Downloaders & Screenshot...");

  // 1. Screenshot: WordPress mshots & Microlink
  try {
    const wpRes = await fetch("https://s0.wp.com/mshots/v1/https://google.com?w=800&h=600");
    console.log("1. WP mshots:", wpRes.status, wpRes.headers.get("content-type"));
  } catch (e: any) {
    console.log("1. WP mshots error:", e.message);
  }

  // 2. TikTok: TikWM public API
  try {
    const tikRes = await fetch("https://www.tikwm.com/api/?url=https://www.tiktok.com/@tiktok/video/7106594312292453675");
    const tik = await tikRes.json();
    console.log("2. TikTok TikWM:", tik.code === 0 ? "SUCCESS" : "FAIL", "Title:", tik.data?.title?.slice(0, 30));
  } catch (e: any) {
    console.log("2. TikTok error:", e.message);
  }

  // 3. YouTube: oEmbed & Invidious public instance
  try {
    const ytOembed = await fetch("https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&format=json");
    const ytData = await ytOembed.json();
    console.log("3. YouTube oEmbed:", ytOembed.status, "Title:", ytData.title);

    const inv = await fetch("https://inv.nadeko.net/api/v1/videos/dQw4w9WgXcQ");
    if (inv.ok) {
      const invData = await inv.json();
      console.log("3b. Invidious format streams:", invData.formatStreams?.length, "first url:", invData.formatStreams?.[0]?.url?.slice(0, 40));
    } else {
      console.log("3b. Invidious status:", inv.status);
    }
  } catch (e: any) {
    console.log("3. YouTube error:", e.message);
  }

  // 4. Pinterest: scraping og:image
  try {
    const pinRes = await fetch("https://www.pinterest.com/pin/993606736528825832/", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    const html = await pinRes.text();
    const ogImgMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    const ogVideoMatch = html.match(/<meta\s+property=["']og:video["']\s+content=["']([^"']+)["']/i);
    console.log("4. Pinterest:", pinRes.status, "og:image:", !!ogImgMatch, ogImgMatch?.[1]?.slice(0, 50), "og:video:", !!ogVideoMatch);
  } catch (e: any) {
    console.log("4. Pinterest error:", e.message);
  }

  // 5. Instagram & Twitter / X: Microlink public media metadata extractor
  try {
    const mlTw = await fetch("https://api.microlink.io/?url=https://twitter.com/jack/status/20&embed=video.url");
    const mlTwData = await mlTw.json();
    console.log("5. Twitter Microlink status:", mlTwData.status, "Author:", mlTwData.data?.author, "Image/Video:", mlTwData.data?.image?.url);

    const mlIg = await fetch("https://api.microlink.io/?url=https://www.instagram.com/p/C-w1x3kP1_L/");
    const mlIgData = await mlIg.json();
    console.log("6. Instagram Microlink status:", mlIgData.status, "Title:", mlIgData.data?.title, "Image:", mlIgData.data?.image?.url);
  } catch (e: any) {
    console.log("5/6. Microlink error:", e.message);
  }
}

testApis();
