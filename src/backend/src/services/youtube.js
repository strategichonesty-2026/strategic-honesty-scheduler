const { google } = require("googleapis");

function getOAuth2Client() {
  return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
}

function getAuthUrl(state) {
  return getOAuth2Client().generateAuthUrl({ access_type: "offline", prompt: "consent", state, scope: ["https://www.googleapis.com/auth/youtube", "https://www.googleapis.com/auth/youtube.force-ssl", "openid"] });
}

async function exchangeCode(code) {
  const { tokens } = await getOAuth2Client().getToken(code);
  return { access_token: tokens.access_token, refresh_token: tokens.refresh_token, expires_at: tokens.expiry_date, scope: tokens.scope, raw: JSON.stringify(tokens) };
}

function buildAuthClient(tokenRow) {
  const client = getOAuth2Client();
  client.setCredentials(JSON.parse(tokenRow.raw));
  return client;
}

async function getChannelInfo(authClient) {
  const { data } = await google.youtube({ version: "v3", auth: authClient }).channels.list({ part: ["snippet", "id"], mine: true });
  const ch = data.items?.[0];
  return ch ? { id: ch.id, title: ch.snippet.title } : null;
}

async function postCommunityPost({ authClient, text }) {
  const { data } = await google.youtube({ version: "v3", auth: authClient }).activities.insert({ part: ["snippet", "contentDetails"], requestBody: { snippet: { type: "bulletin", description: text }, contentDetails: { bulletin: { resourceId: {} } } } });
  return data;
}

async function refreshTokens(tokenRow) {
  const client = buildAuthClient(tokenRow);
  const { credentials } = await client.refreshAccessToken();
  return { access_token: credentials.access_token, expires_at: credentials.expiry_date, raw: JSON.stringify(credentials) };
}

module.exports = { getAuthUrl, exchangeCode, buildAuthClient, getChannelInfo, postCommunityPost, refreshTokens };
