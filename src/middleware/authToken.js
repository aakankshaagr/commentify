const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.SERVER_URL,
);
const scopes = ["https://www.googleapis.com/auth/youtube.force-ssl"];
const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  // Add this to ensure you always receive a refresh token.
  // This is only necessary for the first authorization from the user.
  prompt: 'consent'
});
async function refreshAccessToken(refreshToken) {
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });
  const { credentials } = await oauth2Client.refreshAccessToken();
  oauth2Client.setCredentials(credentials);
  return credentials.access_token;
}

async function authToken(req, res, next) {
  try {
    const accessToken = req.cookies.ytAccessToken;
    const refreshToken = req.cookies.ytRefreshToken;
    console.log("line AUTH TOKEN GENERATED")
    if (!accessToken && refreshToken) {
      const newAccessToken = await refreshAccessToken(refreshToken);
      res.cookie("ytAccessToken", newAccessToken, {
        httpOnly: true,
        secure: true,
      });
    }
     console.log("Access token",accessToken,refreshToken)
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { oauth2Client, authToken };
