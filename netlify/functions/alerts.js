// netlify/functions/alerts.js — TrainRadar France v4
const fetch = require("node-fetch");

exports.handler = async () => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=120",
  };
  try {
    const GtfsRtBindings = require("gtfs-realtime-bindings");
    const res = await fetch(
      "https://proxy.transport.data.gouv.fr/resource/sncf-gtfs-rt-alerts",
      { headers: { Accept: "application/x-protobuf" }, timeout: 8000 }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf  = await res.arrayBuffer();
    const feed = GtfsRtBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buf));
    const alerts = [];
    for (const entity of feed.entity || []) {
      const a = entity.alert;
      if (!a) continue;
      const pick = (t) =>
        t?.translation?.find(x => x.language === "fr")?.text ||
        t?.translation?.[0]?.text || "";
      const header = pick(a.headerText);
      const desc   = pick(a.descriptionText);
      if (header) alerts.push({ header, desc });
    }
    return { statusCode: 200, headers, body: JSON.stringify({ alerts }) };
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ alerts: [] }) };
  }
};
