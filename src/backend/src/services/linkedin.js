const axios = require("axios");

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";
const SCOPES = ["openid", "profile", "w_member_social"].join(" ");

function getAuthUrl(state) {
  const params = new URLSearchParams({ response_type: "code", client_id: process.env.LINKEDIN_CLIENT_ID, redirect_uri: process.env.LINKEDIN_REDIRECT_URI, state, scope: SCOPES });
  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

async function exchangeCode(code) {
  const params = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: process.env.LINKEDIN_REDIRECT_URI, client_id: process.env.LINKEDIN_CLIENT_ID, client_secret: process.env.LINKEDIN_CLIENT_SECRET });
  const { data } = await axios.post(LINKEDIN_TOKEN_URL, params.toString(), { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
  return { access_token: data.access_token, expires_at: Date.now() + data.expires_in * 1000, scope: data.scope, raw: JSON.stringify(data) };
}

async function getProfile(accessToken) {
  const { data } = await axios.get(`${LINKEDIN_API_BASE}/userinfo`, { headers: { Authorization: `Bearer ${accessToken}` } });
  return data;
}

async function postContent({ accessToken, authorUrn, text, mediaUrl, mediaType }) {
  const body = { author: authorUrn, lifecycleState: "PUBLISHED", specificContent: { "com.linkedin.ugc.ShareContent": { shareCommentary: { text }, shareMediaCategory: mediaUrl ? (mediaType === "image" ? "IMAGE" : "VIDEO") : "NONE" } }, visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" } };
  const { data } = await axios.post(`${LINKEDIN_API_BASE}/ugcPosts`, body, { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0" } });
  return data;
}

module.exports = { getAuthUrl, exchangeCode, getProfile, postContent };
