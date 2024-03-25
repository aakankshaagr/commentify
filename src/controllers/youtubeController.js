const { google, youtubeAnalytics_v2 } = require("googleapis");
const { oauth2Client } = require("../middleware/authToken"); // Ensure this path is correct

const scopes = ["https://www.googleapis.com/auth/youtube.force-ssl"];

async function authenticate(req, res) {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
  res.redirect(url);
}

async function oauth2callback(req, res) {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    res.cookie("ytAccessToken", tokens.access_token, { httpOnly: true, secure: true });
    if (tokens.refresh_token) {
      res.cookie("ytRefreshToken", tokens.refresh_token, { httpOnly: true, secure: true });
    }
    res.redirect("/");
  } catch (error) {
    res.status(400).send("Error retrieving access token");
  }
}
async function searchChannel(req, res) {
  const {channelName}=req.body;
  console.log("Search func",channelName, req.body)
  const accessToken = req.cookies.ytAccessToken; // Assuming you have stored the access token in cookies
  const refreshToken = req.cookies.ytRefreshToken; // Assuming you have stored the refresh token in cookies

  if (!accessToken) {
    return res.status(401).send("Access token is required");
  }

  // Initialize the OAuth2 client with the stored tokens
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken // Include the refresh token if available
  });

  // Create a YouTube service client with the authorized OAuth2 client
  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client // This uses the OAuth2 client with the set access token
  });

  try {
    // Check if the access token has expired and refresh it if necessary
    if (oauth2Client.isTokenExpiring()) {
      await oauth2Client.refreshAccessToken();
    }
 
console.log("search func call")  
const response = await youtube.search.list({
    "part": [
      "snippet"
    ],
    "order": "title",
    "q": channelName,
    "safeSearch": "strict",
    "type": [
      "channel"
    ]
  });
      // Here, you should check if there are items in the response
      if (response.data.items && response.data.items.length > 0) {
        const channelId = response.data.items[0].id.channelId;
        const title = response.data.items[0].snippet.title;
        console.log(response.data);
  
        // You should also ensure that 'name' is defined somewhere, otherwise this condition will always fail
        if (title.toLowerCase() === channelName.toLowerCase()) {
          res.send(channelId);
        } else {
          res.status(401).send("Please ensure channel name is correct");
        }
      } else {
        // No channels found, handle this case accordingly
        res.status(404).send("No channel found with the specified name");
      }
    } catch (errors) {
      console.error('The API returned an error: ' + errors);
      // For all other errors, send a generic error message
      res.status(500).send("Error fetching channel info: " + errors.message);
    }
  }

async function postComment(req, res) {
  const { videoId, channelId, text } = req.body;
  const accessToken = req.cookies.ytAccessToken; // Assuming you have stored the access token in cookies
  const refreshToken = req.cookies.ytRefreshToken; // Assuming you have stored the refresh token in cookies

  console.log(text, channelId, videoId);

  if (!accessToken) {
    return res.status(401).send("Access token is required");
  }

  // Initialize the OAuth2 client with the stored tokens
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken // Include the refresh token if available
  });

  // Create a YouTube service client with the authorized OAuth2 client
  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client // This uses the OAuth2 client with the set access token
  });

  try {
    // Check if the access token has expired and refresh it if necessary
    if (oauth2Client.isTokenExpiring()) {
      await oauth2Client.refreshAccessToken();
    }

    // Perform the API call to post the comment
    const response = await youtube.commentThreads.insert({
      part: 'snippet',
      requestBody: {
        snippet: {
          videoId: videoId,
          channelId: channelId,
          topLevelComment: {
            snippet: {
              textOriginal: text,
            },
          },
        },
      },
    });

    // Check the response status code to determine the outcome
    if (response.status === 200) {
      res.status(200).send("Comment posted");
    } else {
      // If the API response is not successful, handle it accordingly
      res.status(response.status).send(`Error posting comment: ${response.statusText}`);
    }
  } catch (errors) {
    console.error('The API returned an error: ' + errors);
    if (errors.code === 401) {
      // If the error code is 401, this means there is an issue with the authentication
      res.status(401).send("Invalid credentials. Please sign in again.");
    } else {
      // For all other errors, send a generic error message
      res.status(500).send("Error posting comment: " + errors.message);
    }
  }
}
async function fetchPlaylists(channelId,accessToken,refreshToken) {
  
  if (!accessToken) {
    return res.status(401).send("Access token is required");
  }

  // Initialize the OAuth2 client with the stored tokens
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken // Include the refresh token if available
  });
    // Create a YouTube service client with the authorized OAuth2 client
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client // This uses the OAuth2 client with the set access token
    });
    try {
      // Check if the access token has expired and refresh it if necessary
      if (oauth2Client.isTokenExpiring()) {
        await oauth2Client.refreshAccessToken();
      }
      
        const response = await youtube.playlists.list({
          part: ["id", "snippet"],
          channelId: channelId,
          maxResults: 500 // Adjust as needed
        });
    
        const playlists = response.data.items.map(playlist => ({
          id: playlist.id,
          title: playlist.snippet.title
        }));
    
        return playlists;
      } catch (error) {
        console.error('Error fetching playlists: ', error);
        throw error;
      }
    
}
async function postCommentOnPlaylist(playlist,accessToken,refreshToken) {
  if (!accessToken) {
    return res.status(401).send("Access token is required");
  }

  // Initialize the OAuth2 client with the stored tokens
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken // Include the refresh token if available
  });

  // Create a YouTube service client with the authorized OAuth2 client
  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client // This uses the OAuth2 client with the set access token
  });

    // Check if the access token has expired and refresh it if necessary
    if (oauth2Client.isTokenExpiring()) {
      await oauth2Client.refreshAccessToken();
    }
    

    let processedVideos = [];

  for (const video of playlist) {
    try {
      const response = await youtube.commentThreads.insert({
        part: 'snippet',
        requestBody: {
          snippet: {
            videoId: video.videoId,
            channelId: video.id,
            topLevelComment: {
              snippet: {
                textOriginal: video.text,
              },
            },
          },
        },
      });
      
      if (response.status === 200) {
        processedVideos.push({ title: video.title, status: 'Comment posted' });
      } else {
        processedVideos.push({ title: video.title, status: 'Error posting comment' });
      }
    } catch (error) {
      console.error(`Error posting comment to video ${video.title}: ${error}`);
      processedVideos.push({ title: video.title, status: 'Error posting comment', error: error.message });
    }
  }

  return processedVideos;
}
    // Perform the API call to post the comment
   
async function fetchVideosFromPlaylist(playlistId,accessToken,refreshToken,comment) {
  //const channelId = req.body.channelId;
  // const accessToken = req.cookies.ytAccessToken; // Assuming you have stored the access token in cookies
  // const refreshToken = req.cookies.ytRefreshToken; // Assuming you have stored the refresh token in cookies

  

  if (!accessToken) {
    return res.status(401).send("Access token is required");
  }

  // Initialize the OAuth2 client with the stored tokens
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken // Include the refresh token if available
  });
    // Create a YouTube service client with the authorized OAuth2 client
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client // This uses the OAuth2 client with the set access token
    });
  
    try {
      // Check if the access token has expired and refresh it if necessary
      if (oauth2Client.isTokenExpiring()) {
        await oauth2Client.refreshAccessToken();
      }

    const response = await youtube.playlistItems.list({
      "part": [
        "contentDetails","snippet"
      ],
      "playlistId": playlistId,
      "maxResults": 500
    })

    // Response with playlists associated with the channel
    const playlists = response.data.items.map(videos => ({
      id: videos.snippet.channelId,
      title: videos.snippet.title,
      videoId:videos.contentDetails.videoId,
      text:comment
    }));

    // Process playlists or return them
    console.log('Playlists: ', playlists);
    return await postCommentOnPlaylist(playlists,accessToken,refreshToken);
  } catch (error) {
    console.error('Error fetching videos from playlist: ', error);
    throw error
  }
}

module.exports = {
  authenticate,
  oauth2callback,
  postComment,
  postCommentOnPlaylist,
  fetchPlaylists,
  searchChannel,
  fetchVideosFromPlaylist,

};



