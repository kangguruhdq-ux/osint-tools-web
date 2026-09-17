async function testMore() {
  // 1. Twitter via fxtwitter API
  try {
    const fxRes = await fetch("https://api.fxtwitter.com/jack/status/20");
    const fx = await fxRes.json();
    console.log("Twitter fxtwitter:", fx.code, fx.tweet?.text, fx.tweet?.author?.name);
  } catch (e: any) {
    console.log("Twitter fxtwitter err:", e.message);
  }

  // 2. Twitter video test
  try {
    const fxVRes = await fetch("https://api.fxtwitter.com/elonmusk/status/1672436402434572288");
    const fxV = await fxVRes.json();
    console.log("Twitter video:", fxV.code, fxV.tweet?.media?.videos?.[0]?.url || fxV.tweet?.media?.photos?.[0]?.url);
  } catch (e: any) {
    console.log("Twitter video err:", e.message);
  }

  // 3. YouTube via Piped API
  try {
    const pipedRes = await fetch("https://pipedapi.kavin.rocks/streams/dQw4w9WgXcQ");
    console.log("Piped status:", pipedRes.status);
    if (pipedRes.ok) {
      const piped = await pipedRes.json();
      console.log("Piped title:", piped.title, "videoStreams:", piped.videoStreams?.length);
    }
  } catch (e: any) {
    console.log("Piped err:", e.message);
  }

  // 4. Test Pinterest oEmbed
  try {
    const pinOembed = await fetch("https://www.pinterest.com/oembed.json?url=https://www.pinterest.com/pin/993606736528825832/");
    console.log("Pinterest oEmbed:", pinOembed.status);
    if (pinOembed.ok) {
      const pin = await pinOembed.json();
      console.log("Pinterest title:", pin.title, "author:", pin.author_name, "thumbnail:", pin.thumbnail_url);
    }
  } catch (e: any) {
    console.log("Pinterest oEmbed err:", e.message);
  }
}

testMore();
