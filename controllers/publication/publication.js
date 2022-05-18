const { ObjectId } = require("mongodb");
const aggregation = require("../../aggregation/aggregation");
const Core = require("../core/coreCtrl");

class Publication extends Core {
    db = undefined;
    collection = undefined;

    init(db) {
        this.db = db;
        this.collection = this.db.collection('publications');
    }

    async create(payload) {
        return new Promise(async (resolve, reject) => {
            if (!payload.ownerId) return reject('Missing parameters');
            const { insertedId } = await this.collection.insertOne({ createdAt: new Date().getTime(), modifiedAt: new Date().getTime(), ...payload, ownerId: ObjectId(payload.ownerId) }, { upsert: true, returnDocument: 'after' });
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
        return new Promise(async (resolve, reject) => {
            if (!payload._id) return reject('Missing parameters');
            const pId = ObjectId.isValid(payload._id) ? ObjectId(payload._id) : null;
            if (!pId) return reject();
            await this.collection.updateOne({ _id: ObjectId(pId) }, { $set: { ...(delete payload._id && delete payload.ownerId && { ...payload }), modifiedAt: new Date().getTime() } });
            resolve(await aggregation(this.collection, [
                {
                    "$match": {
                        "$expr": { "$eq": [ObjectId(pId), "$_id"] }
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

    async delete(payload) {
        return new Promise(async (resolve, reject) => {
            if (!payload.id) return reject('Missing parameters');
            await this.collection.deleteOne({ _id: ObjectId(payload.id) });
            resolve();
        })
    }

    async get(payload) {
        return new Promise(async (resolve, reject) => {
            if (!payload.ownerId) return reject('Missing parameters #publication.js get function');
            const ownerId = ObjectId.isValid(payload.ownerId) ? ObjectId(payload.ownerId) : null;
            if (!ownerId) return reject();
            // Retrieve data from post with meta data of user owner
            resolve(await aggregation(this.collection, [
                {
                    "$unwind": "$wall"
                },
                {
                    "$match": {
                        "$expr": {
                            "$or": [
                                {
                                    "$eq": [payload.ownerId, "$wall._id"] // Get publication posted by friend into my wall
                                },
                                {
                                    "$and": [
                                        {
                                            "$eq": [ownerId, "$ownerId"]
                                        },
                                        {
                                            "$eq": [payload.ownerId, "$wall._id"]
                                        }
                                    ]
                                }
                            ]
                        },
                    }
                },
                { "$sort": { "createdAt": -1 } },
                { "$limit": 25 },
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
                },
                {
                    "$lookup": {
                        "from": "comments",
                        "let": { "id": "$_id" },
                        "as": "comments.data",
                        "pipeline": [
                            {
                                "$match": {
                                    "$expr": {
                                        "$eq": ["$$id", "$publicationId"]
                                    }
                                }
                            },
                            {
                                "$limit": 25
                            }
                        ]
                    },
                },
                {
                    "$lookup": {
                        "from": "users",
                        "let": { "id": "$comments.data.ownerId" },
                        "pipeline": [
                            {
                                "$match": {
                                    "$expr": {
                                        "$in": ["$_id", "$$id"]
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
                            },
                        ],
                        "as": "comments.user"
                    },
                },
            ]).sort({ createdAt: -1 }).toArray());
        })
    }

}

module.exports = Publication;