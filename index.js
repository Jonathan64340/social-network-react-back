const routes = require('./routes/routes');

// Theme
const beautifierLogs = require('./utils/beautifierConsole');

// Env
require('dotenv').config();
const socketCorsUrl = require('./configs/socket.json');

// Dependencies
const express = require('express');
const app = express();
// const cors = require('cors');

// Cors
const allowedOrigins = [process.env.allowedCorsOriginLocal, process.env.allowedCorsOrigin];

// app.use(cors({
//   origin: function (origin, callback) {
//     console.log(origin)
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.indexOf(origin) === -1) {
//       const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
//       return callback(new Error(msg), false);
//     }
//     return callback(null, true);
//   }
// }));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  next();
});

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

const http = require('http').createServer(app);

// Listen server
const port = process.env.PORT || 5000;
const io = require('socket.io')(http.listen(port, () => beautifierLogs('fgBlue', `This server is launched on port ${process.env.PORT || 5000}`)), {
  cors: {
    origin: [socketCorsUrl['socket-cors-url']],
    methods: [socketCorsUrl['socket-cors-methods']]
  },
  httpCompression: true
});

module.exports.io = io;
