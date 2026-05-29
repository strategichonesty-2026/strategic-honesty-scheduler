/**
 * queueService.js (Scheduler side)
 * Sends a queue item to the Media Studio backend.
 */

const MEDIA_STUDIO_URL =
  import.meta.env.VITE_MEDIA_STUDIO_URL ||
  "https://strategic-honesty-media-studio-production.up.railway.app";

/**
 * POST a queue item to Media Studio.
 * @param {object} queueItem - Built by buildQueueItem() from promptGenerator.js
 * @returns {Promise<object>} - The created queue item from Media Studio
 */
export async function sendToMediaStudio(queueItem) {
  const response = await fetch(`${MEDIA_STUDIO_URL}/api/queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(queueItem),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.message || `Media Studio error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get all queue items from Media Studio (for status checking).
 * @param {object} filters - { status, platform, contentType }
 * @returns {Promise<object[]>}
 */
export async function fetchQueueFromStudio(filters = {}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v)
  );
  const url = `${MEDIA_STUDIO_URL}/api/queue${params.size ? "?" + params : ""}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fetch queue error: ${response.status}`);
  return response.json();
}

/**
 * Update queue item status in Media Studio.
 * @param {string} id
 * @param {string} status
 * @returns {Promise<object>}
 */
export async function updateQueueStatus(id, status) {
  const response = await fetch(`${MEDIA_STUDIO_URL}/api/queue/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error(`Update status error: ${response.status}`);
  return response.json();
}
