async function postCommunityPost({ authClient, text }) {
  // YouTube deprecated activities.insert in 2020 — no replacement exists
  throw new Error("YouTube Community Posts are not supported via the YouTube Data API. Google deprecated this feature and has not provided a replacement. Please post directly at youtube.com/community.");
}
