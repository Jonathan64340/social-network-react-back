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

            const friendRequestData = await aggregation(this.collection, [
                {
                    "$match": {
                        "$expr": {
                            "$eq": [insertedId, "$_id"]
                        },
                    },
                },
                {
                    "$project": {
                        "senderId": 1,
                        "receiverId": 1,
                        "status": 1,
                        "createdAt": 1,
                        "friend_id":
                        {
                            "$cond": {
                                "if": {
                                    "$ne": ['$receiverId', ObjectId(senderId).toString()]
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
                        "as": "user"
                    }
                },
                {
                    "$unwind": "$user"
                },
                {
                    "$project": {
                        "user.password": 0,
                        "user.createdAt": 0,
                        "user.modifiedAt": 0,
                        "user.registration_date": 0,
                        "user.last_login": 0,
                        "user.email": 0
                    }
                }
            ])
                .toArray()

            let friendRequest = {};

            for (let i = 0; i < friendRequestData.length; i++) {
                friendRequest = { ...friendRequestData[i] }
            }

            resolve(friendRequest)
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
    friendsSocketFactory({ socket, friendsData, user, updateOnlyOneFriend }) {
        if (!socket) return;

        if (updateOnlyOneFriend) {
            socket.on('update_friend', (data) => {
                if (data) {
                    if (data.user) {
                        if (data.user.sid) {
                            if (data.user.sid) {
                                socket.to(data.user.sid).emit('update_friend', { ...data })
                            }
                        }
                    }
                }
            })
            return
        }

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
                            "$or": [
                                {
                                    "$and": [
                                        {
                                            "$eq": [ObjectId(to).toString(), '$senderId'],
                                        },
                                        {
                                            "$eq": [ObjectId(userId).toString(), '$receiverId'],
                                        },
                                    ]
                                },
                                {
                                    "$and": [
                                        {
                                            "$eq": [ObjectId(userId).toString(), '$senderId']
                                        },
                                        {
                                            "$eq": [ObjectId(to).toString(), '$receiverId']
                                        },
                                    ]
                                }
                            ],
                        },
                    },
                },
                {
                    "$project": {
                        "senderId": 1,
                        "receiverId": 1,
                        "status": 1,
                        "createdAt": 1,
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
                        "as": "user"
                    }
                },
                { "$unwind": "$user" },
                {
                    "$project": {
                        "senderId": 1,
                        "receiverId": 1,
                        "status": 1,
                        "createdAt": 1,
                        "_user":
                        {
                            "$cond": {
                                "if": {
                                    "$eq": ['$user._id', ObjectId(to)]
                                },
                                "then": '$user',
                                "else": ''
                            }
                        },
                    }
                },
                {
                    "$project": {
                        "_user.password": 0,
                        "_user.createdAt": 0,
                        "_user.modifiedAt": 0,
                        "_user.registration_date": 0,
                        "_user.last_login": 0,
                        "_user.email": 0
                    }
                }
            ])
                .toArray()

            let friendsTmp = {};

            if (friends.length === 0) {
                resolve(friendsTmp)
            }

            for (let i = 0; i < friends.length; i++) {
                friendsTmp = { ...friends[i] }

                if (i + 1 === friends.length) {
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
            const friends = await aggregation(this.collection, [{
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
                    "other_id":
                    {
                        "$cond": {
                            "if": {
                                "$ne": ['$senderId', id]
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
                                "$expr":
                                {
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
                                "createdAt": 0,
                                "cover_url": 0
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
                    "friend_id": 0,
                    "other_id": 0
                }
            },
            ])
                .sort({ createdAt: -1 })
                .toArray();

            let skip = 0;
            for (let i = 0; i < friends.length; i++) {
                const last_message = await aggregation(this.collection, [{
                    "$lookup": {
                        "from": "messenger",
                        "pipeline": [{
                            "$match": {
                                "$expr": {
                                    "$and": [{
                                        "$eq": [{ $toString: friends[i].friends_data._id }, "$senderId"]
                                    }, {
                                        "$in": [{ $toString: id }, "$unreads"]
                                    }]
                                }
                            }
                        },
                        {
                            "$count": "unreads"
                        }],
                        "as": "unreads"
                    }

                }, {
                    "$unwind": "$unreads"
                }])
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(1)
                    .toArray();

                if (last_message.length && friends.length) {
                    if ((ObjectId(friends[i].friends_data._id).toString() === ObjectId(last_message[0]._id).toString()).toString()) {
                        skip++;
                        const { unreads } = last_message[0].unreads;

                        friends[i] = {
                            ...friends[i],
                            friends_data: {
                                ...friends[i].friends_data,
                                unreads
                            }
                        }
                    }
                }
            }

            resolve(friends);
        })
    }
}

module.exports = Friend;