const fetch = require("node-fetch");

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;

// Flux Schnell — fast, cheap image generation
const IMAGE_MODEL = "black-forest-labs/flux-schnell";

// LTX Video — Phase 1 video (stub-ready)
const VIDEO_MODEL = "lightricks/ltx-video";

async function generateImage({ prompt, aspectRatio = "1:1", steps = 4 }) {
  if (!REPLICATE_TOKEN) throw new Error("REPLICATE_API_TOKEN not set");

  const res = await fetch(
    `https://api.replicate.com/v1/models/${IMAGE_MODEL}/predictions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REPLICATE_TOKEN}`,
        "Content-Type": "application/json",
        Prefer: "wait", // synchronous wait up to 60s
      },
      body: JSON.stringify({
        input: {
          prompt,
          aspect_ratio: aspectRatio,
          num_inference_steps: steps,
          output_format: "webp",
          output_quality: 85,
        },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Replicate error ${res.status}: ${text}`);
  }

  const data = await res.json();

  if (data.error) throw new Error(`Replicate job failed: ${data.error}`);

  const url = Array.isArray(data.output) ? data.output[0] : data.output;
  if (!url) throw new Error("No output URL returned from Replicate");

  return { url, replicateId: data.id, model: IMAGE_MODEL };
}

async function generateVideo({ prompt, duration = 5 }) {
  if (!REPLICATE_TOKEN) throw new Error("REPLICATE_API_TOKEN not set");

  // Create prediction (async — returns immediately with prediction ID)
  const res = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REPLICATE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: VIDEO_MODEL,
      input: { prompt, duration },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Replicate video error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return { replicateId: data.id, status: data.status, model: VIDEO_MODEL };
}

async function pollPrediction(replicateId) {
  if (!REPLICATE_TOKEN) throw new Error("REPLICATE_API_TOKEN not set");

  const res = await fetch(
    `https://api.replicate.com/v1/predictions/${replicateId}`,
    { headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` } }
  );

  if (!res.ok) throw new Error(`Poll error ${res.status}`);
  const data = await res.json();

  return {
    status: data.status, // starting | processing | succeeded | failed | canceled
    url: Array.isArray(data.output) ? data.output[0] : data.output,
    error: data.error || null,
  };
}

module.exports = { generateImage, generateVideo, pollPrediction };
