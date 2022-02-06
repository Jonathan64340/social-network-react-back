const { ObjectId } = require("mongodb");
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
        return await this.collection.findOne({ _id: ObjectId(identifier._id )}, { projection: { "password": 0, "createdAt": 0, "modifiedAt": 0 } })
    }
}

module.exports = User;