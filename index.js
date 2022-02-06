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
app.use(cors());

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

const io = require('socket.io')(http, {
  cors: {
    origin: socketCorsUrl['socket-cors-url'],
    methods: socketCorsUrl['socket-cors-methods']
  }
});


// Listen server
const port = process.env.PORT || 5000;
http.listen(4000, () => beautifierLogs('fgBlue', `This socketIo server is launched on port ${4000}`));
app.listen(port, () => beautifierLogs('fgBlue', `This server is launched on port ${process.env.PORT || 5000}`));

module.exports.io = io;
