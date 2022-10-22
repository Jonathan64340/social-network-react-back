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
const fileUpload = require('express-fileupload');
const fs = require('fs');

// Cors
const allowedOrigins = ['https://chat.myun-book.com', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    console.log('Origin :: ', origin);
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

// Extended bodyparser
app.use(express.urlencoded({
  extended: true
}));

if (!fs.existsSync(`./public/`)) {
  fs.mkdirSync(`./public/`, 0775, { recursive: true })
  if (!fs.existsSync(`/public/uploads/`)) {
    fs.mkdirSync(`./public/uploads/`, 0775, { recursive: true })
    if (!fs.existsSync(`/public/uploads/media/`)) {
      fs.mkdirSync(`./public/uploads/media/`, 0775, { recursive: true })
      if (!fs.existsSync(`/public/uploads/media/d/`)) {
        fs.mkdirSync(`./public/uploads/media/d/`, 0775, { recursive: true })
      }
    }
  }
} 

// Public directorie
app.use(express.static('public/uploads'));

app.use(fileUpload({
    limits: {
        fileSize: 2 * 1024 * 1024 //2mb
    },
    abortOnLimit: true,
    limitHandler: (req, res, next) => {
    console.log("depassement de la limite ");
    req.fileIsNotOk = true;
    req.msg = "file too large or you didn't upload one ";
    next();
},
//safeFileNames: true
})
);

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
  .catch((err) => console.log(err))

const http = require('http').createServer(app);

// Listen server
const port = process.env.PORT || 5000;
const io = require('socket.io')(http.listen(port, () => beautifierLogs('fgBlue', `This server is launched on port ${process.env.PORT || 5000}`)), {
  cors: {
    origin: socketCorsUrl['socket-cors-url'],
    methods: socketCorsUrl['socket-cors-methods']
  },
  httpCompression: true
});

module.exports.io = io;
