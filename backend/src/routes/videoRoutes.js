const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');

router.post('/info', videoController.getVideoInfo);
router.post('/download', videoController.downloadVideo);
router.get('/videos', videoController.listVideos);
router.delete('/videos/:filename', videoController.deleteVideo);

module.exports = router;
