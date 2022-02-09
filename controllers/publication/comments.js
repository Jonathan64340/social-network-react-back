const { ObjectId } = require("mongodb");
const aggregation = require("../../aggregation/aggregation");
const Core = require("../core/coreCtrl");

class CommentsClass extends Core {
    db = undefined;
    collection = undefined;

    init(db) {
        this.db = db;
        this.collection = this.db.collection('comments');
    }

    async create(payload) {
        return new Promise(async (resolve, reject) => {
            if (!payload || !payload.publicationId) return reject('Mssing parameters on create CommentsClass');
            const { insertedId } = await this.collection.insertOne({ createdAt: new Date().getTime(), modifiedAt: new Date().getTime(), ...payload, ownerId: ObjectId(payload.ownerId), publicationId: ObjectId(payload.publicationId) }, { upsert: true, returnDocument: 'after' });
            resolve(await aggregation(this.collection, [
                {
                    "$match": {
                        "$expr": { "$eq": [ObjectId(insertedId), "$_id"] }
                    }
                },
                {
                    "$lookup": {
                        "from": "users",
                        "let": { "id": "$ownerId" },
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
                        "as": "user"
                    },
                },
                {
                    "$unwind": "$user"
                }
            ]).sort({ createdAt: -1 }).toArray());
        })
    }

    async edit(payload) {

    }

    async delete(payload) {
        return new Promise(async (resolve, reject) => {
            if (!payload.id) return reject('Missing parameters in delete #comments');
            resolve(await this.collection.deleteOne({ _id: ObjectId(payload.id) }));
        })
    }

    async get(payload) {

    }

}

module.exports = CommentsClass;