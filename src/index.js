require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { paymentMiddleware } = require("x402-express");

const app = express();
app.use(express.json());

const SERPER_KEY = process.env.SERPER_API_KEY;
const PORT = process.env.PORT || 8080;
const PAY_TO = "0x57c1C49271B55ae0c26c6b8Ce29C144f9F178F24";
const FACILITATOR = "https://pay-skill.com/x402";

// x402 payment middleware
app.use(
  paymentMiddleware(
    PAY_TO,
    {
      "/search":      { price: "$0.01", network: "base", settlement: "tab" },
      "/images":      { price: "$0.01", network: "base", settlement: "tab" },
      "/videos":      { price: "$0.01", network: "base", settlement: "tab" },
      "/news":        { price: "$0.01", network: "base", settlement: "tab" },
      "/site-search": { price: "$0.01", network: "base", settlement: "tab" },
    },
    FACILITATOR
  )
);

async function serperRequest(endpoint, payload) {
  const res = await axios.post(
    `https://google.serper.dev/${endpoint}`,
    payload,
    {
      headers: {
        "X-API-KEY": SERPER_KEY,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    }
  );
  return res.data;
}

function parseOffset(req) {
  return parseInt(req.query.offset || "0", 10);
}

// 1. Web search
app.get("/search", async (req, res) => {
  const { q, region, lang, daterange } = req.query;
  if (!q) return res.status(400).json({ error: "q is required" });
  const payload = { q, gl: region || "us", hl: lang || "en", num: 10, start: parseOffset(req) };
  if (daterange) payload.tbs = daterange;
  try {
    const data = await serperRequest("search", payload);
    const results = (data.organic || []).map((r, i) => ({
      rank: parseOffset(req) + i + 1,
      title: r.title,
      url: r.link,
      snippet: r.snippet,
      published_date: r.date || null,
      source_domain: new URL(r.link).hostname,
    }));
    res.json({ query: q, total_results: data.searchInformation?.totalResults || null, offset: parseOffset(req), next_offset: parseOffset(req) + results.length, results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Image search
app.get("/images", async (req, res) => {
  const { q, region, lang } = req.query;
  if (!q) return res.status(400).json({ error: "q is required" });
  const payload = { q, gl: region || "us", hl: lang || "en", num: 10, start: parseOffset(req) };
  try {
    const data = await serperRequest("images", payload);
    const results = (data.images || []).map((r, i) => ({
      rank: parseOffset(req) + i + 1, title: r.title, thumbnail_url: r.thumbnailUrl,
      full_url: r.imageUrl, width: r.imageWidth || null, height: r.imageHeight || null,
      source_page_url: r.link, alt_text: r.title,
    }));
    res.json({ query: q, offset: parseOffset(req), next_offset: parseOffset(req) + results.length, results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Video search
app.get("/videos", async (req, res) => {
  const { q, region, lang } = req.query;
  if (!q) return res.status(400).json({ error: "q is required" });
  const payload = { q, gl: region || "us", hl: lang || "en", num: 10 };
  try {
    const data = await serperRequest("videos", payload);
    const results = (data.videos || []).map((r, i) => ({
      rank: i + 1, title: r.title, url: r.link, thumbnail: r.thumbnailUrl || null,
      duration_seconds: r.duration ? r.duration.split(":").reduce((a, t) => 60 * a + +t, 0) : null,
      platform: r.link ? new URL(r.link).hostname.replace("www.", "").split(".")[0] : null,
      published_date: r.date || null,
    }));
    res.json({ query: q, results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. News search
app.get("/news", async (req, res) => {
  const { q, lang, daterange, region } = req.query;
  if (!q) return res.status(400).json({ error: "q is required" });
  const payload = { q, gl: region || "us", hl: lang || "en", num: 10 };
  if (daterange) payload.tbs = daterange;
  try {
    const data = await serperRequest("news", payload);
    const results = (data.news || []).map((r, i) => ({
      rank: i + 1, title: r.title, url: r.link, snippet: r.snippet,
      source: r.source, published_at: r.date || null, language: lang || "en",
    }));
    res.json({ query: q, results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. Site-restricted search
app.get("/site-search", async (req, res) => {
  const { q, domain, region, lang } = req.query;
  if (!q) return res.status(400).json({ error: "q is required" });
  if (!domain) return res.status(400).json({ error: "domain is required" });
  const payload = { q: `site:${domain} ${q}`, gl: region || "us", hl: lang || "en", num: 10, start: parseOffset(req) };
  try {
    const data = await serperRequest("search", payload);
    const results = (data.organic || []).map((r, i) => ({
      rank: parseOffset(req) + i + 1, title: r.title, url: r.link,
      snippet: r.snippet, published_date: r.date || null, source_domain: domain,
    }));
    res.json({ query: q, domain, offset: parseOffset(req), next_offset: parseOffset(req) + results.length, results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// health (unpaid)
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => console.log(`x402-search running on :${PORT} — payTo: ${PAY_TO}`));