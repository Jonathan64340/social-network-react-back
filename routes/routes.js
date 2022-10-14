
const express = require('express');
const router = express.Router();
const _auth = require('../controllers/auth/authCtrl');
const _core = require('../controllers/core/coreCtrl');
const _user = require('../controllers/user/UserCtrl');
const _publication = require('../controllers/publication/publication');
const _comments = require('../controllers/publication/comments');
const _friends = require('../controllers/friend/friend');
const _messenger = require('../controllers/messenger/messenger');
const _media = require('../controllers/media/media');
const beautifierConsole = require('../utils/beautifierConsole');
// const multer = require('../configs/multer_config');

const Auth = new _auth();
const Core = new _core();
const User = new _user();
const Publication = new _publication();
const Comments = new _comments();
const Friends = new _friends();
const Messenger = new _messenger();
const Media = new _media();
const _io = require('../socket/socket.class');
let socket = null;

const init = (db, io) => {
  if (io) socket = io;
  Auth.init(db, socket);
  User.init(db, socket);
  Publication.init(db, socket);
  Comments.init(db, socket);
  Friends.init(db, socket);
  Messenger.init(db, socket);
  Media.init(db);

  // Define socket
  new _io().init(db, socket, {
    Auth,
    User,
    Publication,
    Comments,
    Friends,
    Messenger,
    Media
  });

  // Now we can use like socket.emit('source', data);
}

// Authentication
router.post('/api/v1/auth/login', async function (req, res) {
  await Auth.login(req.body)
    .then(data => { res.status(200).send(data) })
    .catch(err => {
      beautifierConsole('bgRed', err)
      res.status(200).send(err);
    })
});

router.post('/api/v1/auth/register', async function (req, res) {
  await Auth.register(req.body)
    .then(data => { res.status(200).send(data) })
    .catch(err => {
      beautifierConsole('bgRed', err)
      res.status(200).send(err);
    })
});

router.post('/api/v1/auth/password-recover', async function (req, res) {

});

router.post('/api/v1/refreshToken', async (req, res, next) => {
  await Core.authenticateRefreshToken(req, res, next)
    .then(async accessToken => {
      res.send({ accessToken: await accessToken.accessToken });
    })
    .catch(() => res.sendStatus(401))
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

router.post('/api/v1/user/edit', Core.authenticateJWT, async function (req, res) {
  await User.edit(req.body)
    .then(user => {
      res.status(200).send(user)
    })
    .catch(() => res.sendStatus(401))
});
// End user

// Media
router.post('/api/v1/upload', Core.authenticateJWT, async function (req, res) {
  if (req.user) {
    const userId = Object.entries(req.user)[0][1]
    if (userId) {
      await Media.upload({ req, res, userId })
        .then(data => { res.status(200).send(data) })
        .catch(err => {
          res.status(500).send(err)
        })
    } else {
      res.status(403).send('Forbidden')
    }
  } else {
    res.status(403).send('Forbidden')
  }
})
// End media

// Publication
router.post('/api/v1/publication', Core.authenticateJWT, async function (req, res) {
  await Publication.create(req.body)
    .then((result) => {
      res.status(200).send({
        text: 'publication.notification.new.success',
        ...result
      })
    })
    .catch(() => res.status(500).send({}))
})

router.patch('/api/v1/publication/edit/:id', Core.authenticateJWT, async function (req, res) {
  await Publication.edit(req.body)
    .then((result) => {
      res.status(200).send({
        text: 'publication.notification.edit.success',
        ...result
      })
    })
    .catch(() => res.status(500).send({}))
})

router.get('/api/v1/publication', Core.authenticateJWT, async function (req, res) {
  await Publication.get(req.query)
    .then((publications) => {
      res.status(200).send(publications)
    })
    .catch(() => res.status(500).send({}))
})

router.delete('/api/v1/publication', Core.authenticateJWT, async function (req, res) {
  await Publication.delete(req.query)
    .then(() => {
      res.sendStatus(200)
    })
    .catch(() => res.sendStatus(500))
})

// Publication comments
router.post('/api/v1/publication/comment/new', Core.authenticateJWT, async function (req, res) {
  await Comments.create(req.body)
    .then((comment) => {
      res.status(200).send(comment)
    })
    .catch(() => res.sendStatus(500))
})

router.delete('/api/v1/publication/comment/delete', Core.authenticateJWT, async function (req, res) {
  await Comments.delete(req.query)
    .then((comment) => {
      res.status(200).send(comment)
    })
    .catch(() => res.sendStatus(500))
})

router.patch('/api/v1/publication/comment/edit/:id', Core.authenticateJWT, async function (req, res) {
  await Comments.edit(req.body)
    .then((comment) => {
      res.status(200).send(comment)
    })
    .catch(() => res.sendStatus(500))
})

// End publication comments
// End publication

// Friend
router.post('/api/v1/sendFriendRequest', Core.authenticateJWT, async function (req, res) {
  await Friends.sendFriendRequest(req.body)
    .then((friend) => {
      res.status(200).send(friend);
    })
    .catch(() => res.sendStatus(404))
})

router.get('/api/v1/getFriendRequest', Core.authenticateJWT, async function (req, res) {
  await Friends.getFriendRequest(req.query)
    .then((friend) => {
      res.status(200).send(friend);
    })
    .catch(() => res.sendStatus(404))
})

router.patch('/api/v1/replyFriendRequest', Core.authenticateJWT, async function (req, res) {
  await Friends.replyFriendRequest(req.body)
    .then((friend) => {
      res.status(200).send(friend);
    })
    .catch(() => res.sendStatus(404))
})

router.get('/api/v1/getFriends', Core.authenticateJWT, async function (req, res) {
  await Friends.getFriends(req.query)
    .then((friends) => {
      res.status(200).send(friends)
    })
    .catch(() => res.sendStatus(403))
})
// End friend

// Messenger
router.post('/api/v1/messenger/create', Core.authenticateJWT, async function (req, res) {
  await Messenger.createNewMessage(req.body)
    .then((message) => {
      res.status(200).send(message)
    })
    .catch(() => res.sendStatus(500))
})

router.get('/api/v1/messenger/get-message', Core.authenticateJWT, async function (req, res) {
  await Messenger.getMessages(req.query)
    .then((message) => {
      res.status(200).send(message)
    })
    .catch(() => res.sendStatus(500))
})

// End messenger

// Global user interact
router.get('/api/v1/user-list', Core.authenticateJWT, async function (req, res) {
  await User.getUserList(req.query)
    .then((userList) => {
      res.status(200).send(userList)
    })
    .catch(() => res.sendStatus(404))
})

router.get('/api/v1/user', Core.authenticateJWT, async function (req, res) {
  await User.getUser(req.query)
    .then((userList) => {
      res.status(200).send(userList)
    })
    .catch(() => res.sendStatus(404))
})

module.exports.init = init;
module.exports.router = router;