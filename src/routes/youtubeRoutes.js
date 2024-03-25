const express = require("express");

const { authToken } = require("../middleware/authToken");
const youtubeController = require("../controllers/youtubeController");

const router = express.Router();

router.get("/auth", youtubeController.authenticate);
router.get("/oauth2callback", youtubeController.oauth2callback);
//comment-form
router.post("/post", authToken, youtubeController.postComment);
router.get("/comment", (req, res) => {
    res.render("comment-form");
  });

  //search channel
router.get("/", (req, res) => {
      res.render("search-channel");
    }
    )
router.post("/submit", authToken,youtubeController.searchChannel);

//playlist-form
router.get("/playlist", (req, res) => {
    res.render("playlist-form",{playlists:res});
  })

router.post("/playlist", authToken, async (req, res) => {
    const channelId = req.body.channelId;
    const accessToken = req.cookies.ytAccessToken; // Assuming you have stored the access token in cookies
    const refreshToken = req.cookies.ytRefreshToken; // Assuming you have stored the refresh token in cookies

   
    try {
      const playlists = await youtubeController.fetchPlaylists(channelId,accessToken,refreshToken);
      // Send the playlists as JSON
      res.render('playlists', { playlists: playlists });
    } catch (error) {
      // Send an error status with a message
      res.status(500).json(error.message);
    }
  });

  //playlist comment
router.post("/playlist/comment", authToken,async (req, res) => {
  const playlistId=req.body.playlistId
  const  comment =req.body.text
  const accessToken = req.cookies.ytAccessToken; // Assuming you have stored the access token in cookies
    const refreshToken = req.cookies.ytRefreshToken; // Assuming you have stored the refresh token in cookies
    console.log("ID",playlistId)
    try{
      const videos=await youtubeController.fetchVideosFromPlaylist(playlistId,accessToken,refreshToken,comment)
    res.status(200).send(videos)
    }
    catch(error){
      res.status(500).send({ error: error.message, processedVideos: error.processedVideos || [] });
  }
  });
module.exports = router;


