const { ObjectId } = require("mongodb");
const aggregation = require("../../aggregation/aggregation");
const Core = require("../core/coreCtrl");

class Friend extends Core {
    db = undefined;
    collection = undefined;

    init(db) {
        this.db = db;
        this.collection = this.db.collection('friends');
        this.friendsRequestsCollection = this.db.collection('friendsRequests');
    }
}

module.exports = Friend;