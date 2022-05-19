class Socket {
    socket = null;
    db = null;
    _Class = {};

    init(db = null, socket = null, _Class = null) {
        if (!socket) return console.warn('io is not defined is socket.class.js #init function');
        if (_Class) {
            this._Class = { ..._Class };
        }
        if (db && socket) {
            this.db = db;
            this.socket = socket;

            this.socket.on('connection', socket => {
                this._Class.Messenger.messengerSocketFactory({ io: this.socket, socket, emit: this.emit });
                this._Class.Friends.friendsSocketFactory({ io: this.socket, socket, emit: this.emit });
            })
        }
    }

    emit({ channel, data, socket, ...options }) {
        if (!channel) return;
        if (socket && options.send_mode === 'emit') {
            return socket.emit(channel, data);
        }
        if (socket && options.send_mode) {
            return socket[options.send_mode].emit(channel, data);
        }
    }
}

module.exports = Socket;