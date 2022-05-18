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

            const newMessage = await this.collection.insertOne({ context, senderId, receiverId, type, content, createdAt: new Date().getTime(), modifiedAt: new Date().getTime() }, { upsert: true, returnDocument: 'after' });

            resolve(this.collection.findOne({ _id: newMessage.insertedId }));
        })
    }

    getMessages({ context }) {
        return new Promise((resolve, reject) => {
            if (!context) return reject();

            const contextArray = [...context.split(',')];
            if (contextArray.length < 2) return reject();

            resolve(aggregation(this.collection, [
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
                }
            ])
                .sort({ createdAt: -1 })
                .toArray())
        })
    }
}

module.exports = Messenger;