const express = require("express");
const router = express.Router();
const replicate = require("../services/media/replicateProvider");
const jobs = require("../services/media/jobStore");

// ── POST /media/generate ────────────────────────────────────────────────────
// Body: { type, prompt, aspectRatio, contentIdeaId }
// type: 'image' (default) | 'video'
// Returns immediately with jobId; client polls /media/jobs/:id
router.post("/generate", async (req, res) => {
  const { type = "image", prompt, aspectRatio, contentIdeaId } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: "prompt is required" });
  }

  const job = jobs.create({
    type,
    prompt: prompt.trim(),
    settings: { aspectRatio: aspectRatio || "1:1" },
    contentIdeaId: contentIdeaId || null,
    userId: req.user?.id || null,
  });

  // Fire async — do not await
  (async () => {
    jobs.update(job.id, { status: "running" });
    try {
      if (type === "video") {
        const result = await replicate.generateVideo({ prompt });
        jobs.update(job.id, {
          status: "processing", // video is async on Replicate side
          replicateId: result.replicateId,
        });
      } else {
        const result = await replicate.generateImage({
          prompt,
          aspectRatio: aspectRatio || "1:1",
        });
        jobs.update(job.id, {
          status: "complete",
          outputUrl: result.url,
          replicateId: result.replicateId,
        });
      }
    } catch (err) {
      jobs.update(job.id, { status: "failed", error: err.message });
    }
  })();

  res.json({ jobId: job.id, status: "pending" });
});

// ── GET /media/jobs/:id ─────────────────────────────────────────────────────
// Poll this until status === 'complete' or 'failed'
// For video: also polls Replicate if status === 'processing'
router.get("/jobs/:id", async (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found" });

  // For video jobs still processing on Replicate, poll upstream
  if (job.type === "video" && job.status === "processing" && job.replicateId) {
    try {
      const poll = await replicate.pollPrediction(job.replicateId);
      if (poll.status === "succeeded" && poll.url) {
        jobs.update(job.id, { status: "complete", outputUrl: poll.url });
      } else if (poll.status === "failed") {
        jobs.update(job.id, { status: "failed", error: poll.error || "Replicate failed" });
      }
    } catch (err) {
      // Don't fail the request — just return current state
    }
  }

  res.json(jobs.get(req.params.id));
});

// ── GET /media/jobs ─────────────────────────────────────────────────────────
// List recent jobs (optional, for asset library)
router.get("/jobs", (req, res) => {
  const userId = req.user?.id || null;
  res.json(jobs.listByUser(userId));
});

module.exports = router;
