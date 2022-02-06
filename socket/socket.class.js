class Socket {
    io = null;
    db = null;

    init(db = null, io = null) {
        if (!io) return console.warn('io is not defined is socket.class.js #init function');
        if (db && io) {
            this.db = db;
            this.io = io;
            
            this.io.on('connection', socket => {
                socket.emit('test', socket.id);
            })
        }
    }

    emit(nameEmitter = '', data = null) {
        
    }
}

module.exports = Socket;