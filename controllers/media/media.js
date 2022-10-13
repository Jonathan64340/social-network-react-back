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

    async upload({ req }) {
        return new Promise(async (resolve, reject) => {
            try {
                if(!req.files) {
                    resolve({
                        status: false,
                        message: 'No file uploaded'
                    });
                } else {
                    //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
                    let avatar = req.files.avatar;
                    if (!fs.existsSync(`./public/uploads/media/d/${req.body.userId}/`)) {
                        fs.mkdirSync(`./public/uploads/media/d/${req.body.userId}/`)
                        this.upload(req)
                    } else {
                        //Use the mv() method to place the file in the upload directory (i.e. "uploads")
                        avatar.mv(`./public/uploads/media/d/${req.body.userId}/${avatar.name}`, (err, data) => {
                            console.log(err, data)
                        })
            
                        //send response
                        resolve({
                            status: true,
                            message: 'File is uploaded',
                            data: {
                                name: avatar.name,
                                mimetype: avatar.mimetype,
                                size: avatar.size
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