const express = require('express');
const AppController = require('../controllers/AppController');
const FilesController = require('../controllers/FilesController');
const UserController = require('../controllers/UsersController');

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.get('/files/:id', FilesController.getShow);
router.get('/files', FilesController.getIndex);
router.post('/files', FilesController.postUpload);
router.post('/users', UserController.postNew);

module.exports = router;
