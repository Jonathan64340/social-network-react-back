const { ObjectId } = require("mongodb");
const aggregation = require("../../aggregation/aggregation");
const Core = require("../core/coreCtrl");

class Friend extends Core {
    db = undefined;
    collection = undefined;

    init(db) {
        this.db = db;
        this.collection = this.db.collection('friendsRequests');
    }

    sendFriendRequest({ senderId, receiverId, status }) {
        return new Promise(async (resolve, reject) => {
            if (!senderId || !receiverId || !status) return reject();

            const { insertedId } = await this.collection.insertOne({ senderId, receiverId, status: 'pending', createdAt: new Date().getTime() }, { upsert: true, returnDocument: 'after' });
            const friendRequestData = await this.collection.findOne({ _id: insertedId });
            resolve(friendRequestData);
        })
    }

    getFriendRequest({ userId, to }) {
        return new Promise(async (resolve, reject) => {
            if (!userId || !to) return reject();
            const friendRequest = await this.collection.findOne({ $or: [{ senderId: userId, receiverId: to }, { senderId: to, receiverId: userId }] }, { $orderby: { createdAt: -1 } });
            resolve(friendRequest);
        })
    }

    replyFriendRequest({ id, senderId, receiverId, status }) {
        return new Promise(async (resolve, reject) => {
            if (!id || !senderId || !receiverId || !status) return reject();
            if (status === 'pending' || status === 'decline' || status === 'accept') {
                const pId = ObjectId.isValid(id) ? ObjectId(id) : null;
                if (!pId) return reject();

                if (status === 'decline') {
                    await this.collection.deleteOne({ _id: pId });
                    resolve({ status: 'decline' });
                }

                await this.collection.updateOne({ _id: pId }, { $set: { status } });
                const result = await this.collection.findOne({ _id: pId });
                resolve(result);
            } else {
                reject()
            }
        })
    }

    getFriends({ id }) {
        return new Promise(async (resolve, reject) => {
            if (!id) return reject();

            // All request friends equals to accept, and then get all users from the returned friend_id with function toObjectId
            resolve(await aggregation(this.collection, [{
                "$match": {
                    "$expr": {
                        "$or": [{
                            "$and": [{
                                "$eq": [id, "$receiverId"],
                            }, {
                                "$eq": ['accept', "$status"],
                            }]
                        }, {
                            "$and": [{
                                "$eq": [id, "$senderId"],
                            }, {
                                "$eq": ['accept', "$status"]
                            }]
                        }]
                    },
                },
            }, {
                "$project": {
                    "_id": 0,
                    "friend_id":
                    {
                        "$cond": {
                            "if": {
                                "$ne": ['$receiverId', id]
                            },
                            "then": { $toObjectId: '$receiverId' },
                            "else": { $toObjectId: '$senderId' }
                        }
                    },

                }
            }, {
                "$lookup": {
                    "from": "users",
                    "let": { "id": "$friend_id" },
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$eq": ["$_id", "$$id"]
                                }
                            }
                        },
                        {
                            "$project": {
                                "password": 0,
                                "registration_date": 0,
                                "modifiedAt": 0,
                                "email": 0,
                                "createdAt": 0
                            }
                        }
                    ],
                    "as": "friends_data"
                },
            }, {
                "$project": {
                    "friend_id": 0
                }
            }

            ])
                .sort({ createdAt: -1 })
                .toArray())
        })
    }
}

module.exports = Friend;