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
        return await this.collection.findOne({ _id: ObjectId(identifier._id) }, { projection: { "password": 0, "createdAt": 0, "modifiedAt": 0 } })
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
            if (!id) return reject();
            const user = this.collection.findOne({ _id: ObjectId(id) }, { projection: { username: 1 } }, (err, result) => {
                if (err) return reject();
                resolve(result);
            });
        })
    }
}

module.exports = User;