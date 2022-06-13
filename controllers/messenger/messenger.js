const { ObjectId } = require("mongodb");
const aggregation = require("../../aggregation/aggregation");
const Core = require("../core/coreCtrl");

class Messenger extends Core {
    db = undefined;
    collection = undefined;

    init(db) {
        this.db = db;
        this.collection = this.db.collection('messenger');
    }

    createNewMessage({ context, senderId, receiverId, type, content }) {
        return new Promise(async (resolve, reject) => {

            if (
                !context ||
                !senderId ||
                !receiverId ||
                !type ||
                !content ||
                typeof content.message !== 'string' ||
                (typeof content.message === 'string' && content.message.length) === 0
            ) return reject();

            let unreads = [];
            unreads.push(receiverId);

            const newMessage = await this.collection.insertOne({ context, senderId, receiverId, type, content, createdAt: new Date().getTime(), modifiedAt: new Date().getTime(), unreads: unreads }, { upsert: true, returnDocument: 'after' });

            resolve(this.collection.findOne({ _id: newMessage.insertedId }));
        })
    }

    messengerSocketFactory({ socket }) {
        if (!socket) return;
        socket.on('messenger', (data) => {
            if (data.to) {
                const to = data.to;
                socket.to(to).emit('messenger', { ...data, from: data.from })
            } else {
                socket.emit('messenger', { ...data })
            }
        })
    }

    getMessages({ context, skip }) {
        return new Promise(async (resolve, reject) => {
            if (!context) return reject();

            const contextArray = [...context.split(',')];
            if (contextArray.length < 2) return reject();

            if (!skip) {
                await this.collection.updateMany({
                    "context": { "$in": [contextArray[1], "context"] },
                    "receiverId": contextArray[1],
                    "senderId": contextArray[0]
                },
                    { "$pull": { "unreads": contextArray[1] } }
                );
            }

            const messages = await aggregation(this.collection, [
                {
                    "$match": {
                        "$expr": {
                            "$and": [
                                {
                                    "$in": [contextArray[0], "$context"]
                                },
                                {
                                    "$in": [contextArray[1], "$context"]
                                }
                            ]
                        }
                    },
                },
                {
                    "$project": {
                        "senderId": 1,
                        "receiverId": 1,
                        "context": 1,
                        "createdAt": 1,
                        "modifiedAt": 1,
                        "_id": 1,
                        "content": 1,
                        "type": 1,
                        "unreads": 1,
                    }
                },
                {
                    "$sort": { createdAt: -1 }
                },
                {
                    "$skip": parseInt(skip) || 0
                },
                {
                    "$limit": 20
                }
            ])
                .toArray();

            if (!skip) {
                // Count document   
                const count = await aggregation(this.collection, [
                    {
                        "$match": {
                            "$expr": {
                                "$and": [
                                    {
                                        "$in": [contextArray[0], "$context"]
                                    },
                                    {
                                        "$in": [contextArray[1], "$context"]
                                    }
                                ]
                            }
                        }
                    },
                    {
                        "$group": {
                            "_id": "$senderId",
                            "count": {
                                "$sum": 1
                            }
                        }
                    }]).toArray();

                if (messages.length) {
                    messages[0].count = count.map(c => c.count).reduce((prev, next) => { return prev + next });
                }

                resolve(messages);
            } else {
                resolve(messages);
            }
        })
    }
}

module.exports = Messenger;