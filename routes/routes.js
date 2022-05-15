
const express = require('express');
const router = express.Router();
const _auth = require('../controllers/auth/authCtrl');
const _core = require('../controllers/core/coreCtrl');
const _user = require('../controllers/user/UserCtrl');
const _publication = require('../controllers/publication/publication');
const _comments = require('../controllers/publication/comments');
const _friends = require('../controllers/friend/friend');
const beautifierConsole = require('../utils/beautifierConsole');

const Auth = new _auth();
const Core = new _core();
const User = new _user();
const Publication = new _publication();
const Comments = new _comments();
const Friends = new _friends();
const _io = require('../socket/socket.class');
let socket = null;

const init = (db, io) => {
  Auth.init(db);
  User.init(db);
  Publication.init(db);
  Comments.init(db);
  if (io) socket = io;

  // Define socket
  new _io().init(db, io);

  // Now we can use like socket.emit('source', data);
}

// Authentication
router.post('/api/v1/auth/login', function (req, res) {
  Auth.login(req.body)
    .then(data => { res.status(200).send(data) })
    .catch(err => {
      beautifierConsole('bgRed', err)
      res.status(200).send(err);
    })
});

router.post('/api/v1/auth/register', function (req, res) {
  Auth.register(req.body)
    .then(data => { res.status(200).send(data) })
    .catch(err => {
      beautifierConsole('bgRed', err)
      res.status(200).send(err);
    })
});

router.post('/api/v1/auth/password-recover', function (req, res) {

});

router.post('/api/v1/refreshToken', (req, res, next) => {
  Core.authenticateRefreshToken(req, res, next)
    .then(async accessToken => {
      res.send({ accessToken: await accessToken.accessToken });
    })
});
// End authentication

// User
router.get('/api/v1/user/me', Core.authenticateJWT, async function (req, res) {
  if (req.headers.authorization) {
    await User.getMe({ token: req.headers.authorization.split(' ')[1] })
    .then(user => {
      res.status(200).send(user)
    })
    .catch(() => res.sendStatus(401))
  }
});
// End user

// Publication
router.post('/api/v1/publication', Core.authenticateJWT, async function (req, res) {
  Publication.create(req.body)
    .then((result) => {
      res.status(200).send({
        text: 'publication.notification.new.success',
        ...result
      })
    })
    .catch(() => res.status(500).send({}))
})

router.patch('/api/v1/publication/edit/:id', Core.authenticateJWT, async function (req, res) {
  Publication.edit(req.body)
    .then((result) => {
      res.status(200).send({
        text: 'publication.notification.edit.success',
        ...result
      })
    })
    .catch(() => res.status(500).send({}))
})

router.get('/api/v1/publication', Core.authenticateJWT, async function (req, res) {
  Publication.get(req.query)
    .then((publications) => {
      res.status(200).send(publications)
    })
    .catch(() => res.status(500).send({}))
})

router.delete('/api/v1/publication', Core.authenticateJWT, async function (req, res) {
  Publication.delete(req.query)
    .then(() => {
      res.sendStatus(200)
    })
    .catch(() => res.sendStatus(500))
})

// Publication comments
router.post('/api/v1/publication/comment/new', Core.authenticateJWT, async function (req, res) {
  Comments.create(req.body)
    .then((comment) => {
      res.status(200).send(comment)
    })
    .catch(() => res.sendStatus(500))
})

router.delete('/api/v1/publication/comment/delete', Core.authenticateJWT, async function (req, res) {
  Comments.delete(req.query)
    .then((comment) => {
      res.status(200).send(comment)
    })
    .catch(() => res.sendStatus(500))
})

router.patch('/api/v1/publication/comment/edit/:id', Core.authenticateJWT, async function (req, res) {
  Comments.edit(req.body)
    .then((comment) => {
      res.status(200).send(comment)
    })
    .catch(() => res.sendStatus(500))
})

// End publication comments
// End publication

// Friend
router.post('/api/v1/sendFriendRequest', Core.authenticateJWT, async function (req, res) {
  
})

router.get('/api/v1/getFriendRequest', Core.authenticateJWT, async function (req, res) {
  
})

router.post('/api/v1/friendRequestAction', Core.authenticateJWT, async function (req, res) {
  
})
// End friend

// Global user interact
router.get('/api/v1/user-list', Core.authenticateJWT, async function (req, res) {
   User.getUserList(req.query)
    .then((userList) => {
      res.status(200).send(userList)
    })
    .catch(() => res.sendStatus(404))
})

router.get('/api/v1/user', Core.authenticateJWT, async function (req, res) {
  User.getUser(req.query)
   .then((userList) => {
     res.status(200).send(userList)
   })
   .catch(() => res.sendStatus(404))
})

module.exports.init = init;
module.exports.router = router;