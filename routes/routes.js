
const express = require('express');
const router = express.Router();
const _auth = require('../controllers/auth/authCtrl');
const _core = require('../controllers/core/coreCtrl');
const _user = require('../controllers/user/UserCtrl');
const _publication = require('../controllers/publication/publication');
const beautifierConsole = require('../utils/beautifierConsole');
const Auth = new _auth();
const Core = new _core();
const User = new _user();
const Publication = new _publication();
const _io = require('../socket/socket.class');
let socket = null;

const init = (db, io) => {
  Auth.init(db);
  User.init(db);
  Publication.init(db);
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

// Tokens
router.post('/api/v1/auth/token', function (req, res) {

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
    res.status(200).send(await User.getMe({ token: req.headers.authorization.split(' ')[1] }));
  }
});
// End user

// Publication
router.post('/api/v1/publication', Core.authenticateJWT, async function (req, res) {
  Publication.create(req.body)
    .then((result) => {
      console.log(result)
      res.status(200).send({
        text: 'publication.notification.new.success',
        ...result
      })
    })
    .catch(() => res.status(500).send({}))
})

router.patch('/api/v1/publication/edit/:id', Core.authenticateJWT, async function (req, res) {
  Publication.create(req.body)
    .then(() => {
      res.status(200).send('publication.notification.edit.success')
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
// End publication

module.exports.init = init;
module.exports.router = router;