import express from "express";
import webpush from "web-push";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
const DB = path.join(__dirname, "subscriptions.json");

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}
function readSubs() {
  try { return JSON.parse(fs.readFileSync(DB, "utf8")); } catch { return []; }
}
function writeSubs(data) { fs.writeFileSync(DB, JSON.stringify(data, null, 2)); }

app.get("/api/config", (_req, res) => {
  res.json({
    vapidPublicKey: VAPID_PUBLIC_KEY || null,
    product: {
      url: "https://musinsa.onelink.me/PvkC/t0cn3kqj",
      color: "블랙: 서밋 화이트",
      size: "L",
      sku: "IR2245-010"
    }
  });
});

app.post("/api/subscribe", (req, res) => {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return res.status(503).json({ error: "푸시 서버 설정이 아직 완료되지 않았습니다." });
  }
  const sub = req.body;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return res.status(400).json({ error: "잘못된 푸시 구독 정보입니다." });
  }
  const subs = readSubs();
  if (!subs.some(x => x.endpoint === sub.endpoint)) subs.push(sub);
  writeSubs(subs);
  res.json({ ok: true });
});

app.post("/api/test-push", async (_req, res) => {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return res.status(503).json({ error: "푸시 서버 설정이 아직 완료되지 않았습니다." });
  }
  const payload = JSON.stringify({
    title: "무신사 재입고 알리미",
    body: "테스트 알림입니다. 실제 재입고 알림은 재고 확인 연동 후 작동합니다.",
    url: "https://musinsa.onelink.me/PvkC/t0cn3kqj"
  });
  const subs = readSubs();
  const results = await Promise.allSettled(subs.map(s => webpush.sendNotification(s, payload)));
  const kept = subs.filter((_, i) => results[i].status === "fulfilled" ||
    results[i].reason?.statusCode !== 410);
  writeSubs(kept);
  res.json({ sent: results.filter(x => x.status === "fulfilled").length });
});

// IMPORTANT: Connect an authorized/verified Musinsa stock data source here.
// Do not scrape around login, CAPTCHA, rate limits, or access controls.
// This endpoint intentionally reports "not connected" until a legitimate
// stock source and exact option mapping are configured.
app.get("/api/stock", (_req, res) => {
  res.status(501).json({
    connected: false,
    status: "not_connected",
    message: "무신사 재고 데이터 연동이 필요합니다. 현재는 재고를 확인하거나 감시하지 않습니다."
  });
});

app.listen(PORT, () => console.log(`App listening on ${PORT}`));
