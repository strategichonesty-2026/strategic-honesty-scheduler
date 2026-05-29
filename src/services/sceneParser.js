/**
 * sceneParser.js (Scheduler frontend service)
 * Calls Claude API to generate structured scene breakdown from post text.
 * Returns JSON scenes ready for Creatomate video assembly.
 */

const CLAUDE_API_URL = "https://strategic-honesty-media-studio-production.up.railway.app/api/claude/messages";
const MODEL = "claude-sonnet-4-20250514";

const SCENE_SYSTEM = `You are a video director for Strategic Honesty, a leadership brand.
Brand: dark navy + gold, warm mentor tone, "Be Good. Do Good. Do Well."

Given a social media post, generate a short-form vertical video script (30-60 seconds).
Return ONLY valid JSON, no markdown, no preamble:

{
  "title": "short video title",
  "totalDuration": 45,
  "hook": "first 3 words that grab attention",
  "scenes": [
    {
      "index": 0,
      "title": "Hook",
      "duration": 5,
      "voiceover": "exact words spoken",
      "visualPrompt": "photorealistic image prompt, no people faces, symbolic",
      "stockQuery": "2-3 word Pexels search term",
      "captionText": "SHORT CAPTION (max 6 words)",
      "motionStyle": "slow_zoom_in | slow_zoom_out | pan_left | pan_right | static"
    }
  ],
  "musicMood": "inspirational | upbeat | calm | dramatic",
  "captionStyle": "bold_white | yellow_outline | minimal"
}

Rules:
- 4-8 scenes, each 4-10 seconds, total 30-60s
- voiceover must sound natural when spoken aloud
- stockQuery must be simple enough to find real Pexels results
- captionText is the on-screen text (shorter than voiceover)`;

/**
 * Generate structured scene data from post text.
 * @param {string} postText
 * @param {string} platform
 * @param {string} contentType
 * @returns {Promise<object>} Full scene breakdown
 */
export async function generateScenes(postText, platform = "tiktok", contentType = "short_video") {
  const res = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.REACT_APP_ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-ipc": "true" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      system: SCENE_SYSTEM,
      messages: [{
        role: "user",
        content: `Platform: ${platform}\nContent type: ${contentType}\n\nPost:\n${postText}\n\nGenerate the video scene breakdown.`
      }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
  const data = await res.json();
  const raw = data.content?.find(b => b.type === "text")?.text || "";

  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    throw new Error("Failed to parse scene JSON: " + raw.slice(0, 200));
  }
}

/**
 * Build a Creatomate template payload from scene data + asset URLs.
 * @param {object} sceneData - from generateScenes()
 * @param {object[]} assets - [{sceneIndex, imageUrl, audioUrl, audioDuration}]
 * @returns {object} Creatomate render payload
 */
export function buildCreatomatePayload(sceneData, assets) {
  const elements = sceneData.scenes.map((scene, i) => {
    const asset = assets[i] || {};
    return {
      type: "composition",
      duration: scene.duration,
      elements: [
        // Background image with Ken Burns motion
        {
          type: "image",
          source: asset.imageUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(scene.visualPrompt)}?width=1080&height=1920&nologo=true`,
          fit: "cover",
          ...(scene.motionStyle === "slow_zoom_in"  && { "x.keyframes": [{ time: 0, value: "50%" }, { time: scene.duration, value: "53%" }], "y.keyframes": [{ time: 0, value: "50%" }, { time: scene.duration, value: "52%" }] }),
          ...(scene.motionStyle === "slow_zoom_out" && { "x.keyframes": [{ time: 0, value: "53%" }, { time: scene.duration, value: "50%" }] }),
          ...(scene.motionStyle === "pan_left"      && { "x.keyframes": [{ time: 0, value: "55%" }, { time: scene.duration, value: "45%" }] }),
          ...(scene.motionStyle === "pan_right"     && { "x.keyframes": [{ time: 0, value: "45%" }, { time: scene.duration, value: "55%" }] }),
        },
        // Dark overlay for text readability
        { type: "rectangle", fill_color: "rgba(0,0,0,0.35)", width: "100%", height: "100%" },
        // Caption text
        {
          type: "text",
          text: scene.captionText || scene.voiceover.slice(0, 40),
          font_family: "Montserrat",
          font_weight: "700",
          font_size: 52,
          fill_color: "#FFFFFF",
          stroke_color: "#000000",
          stroke_width: 2,
          x_alignment: "50%",
          y: "75%",
          width: "85%",
        },
        // Voiceover audio
        ...(asset.audioUrl ? [{
          type: "audio",
          source: asset.audioUrl,
          audio_fade_in: 0.3,
          audio_fade_out: 0.3,
        }] : []),
      ],
    };
  });

  return {
    output_format: "mp4",
    width: 1080,
    height: 1920,
    frame_rate: 24,
    elements,
  };
}
