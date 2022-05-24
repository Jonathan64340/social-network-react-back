const routes = require('./routes/routes');

// Theme
const beautifierLogs = require('./utils/beautifierConsole');

// Env
require('dotenv').config();
const socketCorsUrl = require('./configs/socket.json');

// Dependencies
const express = require('express');
const app = express();
const cors = require('cors');

// Cors
const allowedOrigins = ['https://myun-book.com', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

// Bodyparser
app.use(express.json());

// Core
const Core = require('./controllers/core/coreCtrl');

// Define core controller
const CoreClass = new Core();
CoreClass.init()
  .then(db => {
    routes.init(db, io);

    // Define routes
    app.use(routes.router);

  })
  .catch(() => console.log())

const fs = require('fs');

const options = {
  key: fs.readFileSync('./configs/certificates/private.key'),
  cert: fs.readFileSync('./configs/certificates/certificate.crt'),
  ca: fs.readFileSync('./configs/certificates/ca_bundle.crt')
};

const https = require('https').createServer({ ...options }, app);

// Listen server
const port = process.env.PORT || 5000;
const io = require('socket.io')(https.listen(port, () => beautifierLogs('fgBlue', `This server is launched on port ${process.env.PORT || 5000}`)), {
  cors: {
    origin: socketCorsUrl['socket-cors-url'],
    methods: socketCorsUrl['socket-cors-methods']
  },
  httpCompression: true
});

module.exports.io = io;
