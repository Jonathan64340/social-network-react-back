const { ObjectId } = require("mongodb");
const aggregation = require("../../aggregation/aggregation");
const Core = require("../core/coreCtrl");

class User extends Core {
    db = undefined;
    collection = undefined;

    init(db) {
        this.db = db;
        this.collection = this.db.collection('users');
    }

    async getMe(data) {
        const identifier = await this.jwtDecode({ token: data.token });
        const identifierId = ObjectId.isValid(identifier._id) ? ObjectId(identifier._id) : null;
        if (!identifierId) return reject();
        return await this.collection.findOne({ _id: identifierId }, { projection: { "password": 0, "createdAt": 0, "modifiedAt": 0 } })
    }

    async getUserList({ query }) {
        return new Promise(async (resolve, reject) => {
            if (!query) reject();
            const list = await this.collection.find({
                $or: [
                    {
                        "username": {
                            "$regex": query
                        }
                    },
                    {
                        "email": {
                            "$regex": query
                        }
                    }
                ]
            }).toArray();

            resolve(list);
        })
    }

    async getUser({ id }) {
        return new Promise(async (resolve, reject) => {
            const userId = ObjectId.isValid(id) ? ObjectId(id) : null;
            if (!userId) return reject();
            this.collection.findOne({ _id: userId }, { projection: { username: 1, avatar_url: 1, cover_url: 1 } }, (err, result) => {
                if (err) return reject();
                resolve(result);
            });
        })
    }

    async edit({ _id, sid, status, type, ...payload }) {
        return new Promise(async (resolve, reject) => {
            const userId = ObjectId.isValid(_id) ? ObjectId(_id) : null;
            if (!userId) return reject();
            const data = {
                ...((typeof sid !== 'undefined') && { sid: sid }),
                ...((typeof status !== 'undefined') && { status: status, modifiedAt: new Date().getTime() }),
                ...((typeof type !== 'undefined' && type === 'login') && { last_login: new Date().getTime() }),
                ...((typeof payload !== 'undefined' && typeof payload.avatar_url !== 'undefined' && { avatar_url: payload.avatar_url })),
                ...((typeof payload !== 'undefined' && typeof payload.cover_url !== 'undefined' && { cover_url: payload.cover_url }))
            }
            await this.collection.updateOne({ _id: userId }, { $set: { ...data } });
            resolve({})
        })
    }

    async userSocketFactory({ socket, last_login }) {
        return new Promise(async (resolve, reject) => {
            if (!socket.id) return reject();
            await this.collection.updateOne({ sid: socket.id }, {
                $set: {
                    status: 'busy',
                    ...(last_login && { last_login: last_login })
                }
            });

            resolve(await this.collection.findOne({ sid: socket.id }))

        })

    }
}

module.exports = User;