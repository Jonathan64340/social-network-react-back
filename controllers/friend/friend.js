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

    /**
     * 
     * @param {*} param0 
     * @returns username: 'Jonathan Domingues',
                sid: 'e1vOwlUyzwGCd_akAAAD',
                status: 'online',
                _id: '62065a4c1199657b86dbfb67',
                friends: [ { friends_data: [Object] }, { friends_data: [Object] } ]
     */
    friendsSocketFactory({ socket, friendsData, user }) {
        if (!socket) return;

        if (friendsData && user) {
            if (friendsData.length > 0) {
                const friends = friendsData;
                if (friends) {
                    for (let i = 0; i < friends.length; i++) {
                        const { username, sid, status, _id } = user;
                        socket.to(friends[i]['friends_data']['sid']).emit('update_friends_list', { username, sid, status, _id, friends: friendsData, from: socket.id })
                    }
                }
            }
        } else {
            socket.on('update_friends_list', (data) => {
                if (data.friends.length > 0) {
                    const friends = data.friends;
                    delete data.friends;
                    if (friends) {
                        for (let i = 0; i < friends.length; i++) {
                            socket.to(friends[i]['friends_data']['sid']).emit('update_friends_list', { ...data, from: socket.id })
                        }
                    }
                }
            })
        }

    }

    getFriendRequest({ userId, to }) {
        return new Promise(async (resolve, reject) => {
            if (!userId || !to) return reject();

            const friends = await aggregation(this.collection, [
                {
                    "$match": {
                        "$expr":
                        {
                            "$and": [
                                { "senderId": userId, "receiverId": to },
                                { "senderId": to, "receiverId": userId }
                            ]
                        }
                    },
                },
                {
                    "$project": {
                        "friend_id":
                        {
                            "$cond": {
                                "if": {
                                    "$ne": ['$receiverId', ObjectId(userId).toString()]
                                },
                                "then": { $toObjectId: '$receiverId' },
                                "else": { $toObjectId: '$senderId' }
                            }
                        },
                    }
                },
                {
                    "$lookup": {
                        "from": "users",
                        "let": { "id": "$friend_id" },
                        "pipeline": [
                            {
                                "$match": {
                                    "$expr": {
                                        "$eq": ['$$id', '$_id']
                                    }
                                }
                            }
                        ],
                        "as": "usr"
                    }
                },
                { "$unwind": "$usr" },
                {
                    "$project": {
                        "request": {
                            'senderId': 1
                        },
                        "_user":
                        {
                            "$cond": {
                                "if": {
                                    "$eq": ['$usr._id', ObjectId(to)]
                                },
                                "then": '$usr',
                                "else": ''
                            }
                        },
                    }
                },
            ])
                .toArray()

            let friendsTmp = {};

            if (friends.length === 0) {
                resolve(friendsTmp)
            }

            for (let i = 0; i < friends.length; i++) {
                friendsTmp = { ...friends[i] }

                if (i + 1 === friends.length) {
                    console.log(friendsTmp)
                    resolve(friendsTmp)
                }
            }

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
                "$unwind": "$friends_data"
            },
            {
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