const { ObjectId } = require("mongodb");
const aggregation = require("../../aggregation/aggregation");
const Core = require("../core/coreCtrl");
const fs = require('fs');

class Media extends Core {
    db = undefined;
    collection = undefined;

    init(db) {
        this.db = db;
        this.collection = this.db.collection('media');
    }

    async upload({ req, res, userId }) {
        return new Promise(async (resolve, reject) => {
            try {
                if (typeof req.files === 'undefined' || typeof userId === 'undefined') {
                    resolve({
                        status: false,
                        message: 'No file uploaded'
                    });
                } else {
                    //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
                    let file = req.files.file;
                    if (!fs.existsSync(`./public/uploads/media/d/${userId}/`)) {
                        fs.mkdirSync(`./public/uploads/media/d/${userId}/`)
                        this.upload({ req, res, userId })
                    } else {
                        //Use the mv() method to place the file in the upload directory (i.e. "uploads")
                        await file.mv(`./public/uploads/media/d/${userId}/${file.name}`, (err, data) => {
                            console.log(err, data)
                        })

                        //send response
                        res.status(200).send({
                            status: true,
                            message: 'File is uploaded',
                            data: {
                                name: file.name,
                                mimetype: file.mimetype,
                                size: file.size,
                                path: req.protocol + '://' + req.get('host') + '/media/d/' + userId + '/' + file.name
                            }
                        });
                    }
                }
            } catch (err) {
                reject(err);
            }
        })

    }

}

module.exports = Media;