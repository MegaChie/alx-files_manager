const express = require('express');
const AppController = require('../controllers/AppController');
const FilesController = require('../controllers/FilesController');
const UserController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');
const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.get('/files/:id', FilesController.getShow);
router.get('/files', FilesController.getIndex);
router.get('/files/:id/data', FilesController.getFile);
router.get('/connect',AuthController.getConnect);
router.get('/disconnect',AuthController.getConnect);
router.get('/users/me',UserController.getMe);
router.post('/files', FilesController.getDisconnect);

router.post('/users', UserController.postNew);
router.put('/files/:id/publish', FilesController.putPublish);
router.put('/files/:id/unpublish', FilesController.putUnpublish);

module.exports = router;
