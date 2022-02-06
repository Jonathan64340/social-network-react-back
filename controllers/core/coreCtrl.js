const beautifierConsole = require("../../utils/beautifierConsole");
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');

class Core {

    db = '';
    client = '';
    dbName = '';

    async init(url = process.env.DB_URL, dbname = process.env.DB_NAME) {
        return new Promise(async (resolve, reject) => {
            if (typeof url === undefined || typeof dbname === 'undefined') return;
            this.client = new MongoClient(url);
            this.dbName = dbname;

            try {
                await this.client.connect();
                beautifierConsole('bgGreen', 'Successfully connected on DB');
                this.db = this.client.db(this.dbName);
                resolve(this.db);
            } catch (err) {
                beautifierConsole('bgRed', `Error loggin on DB ${err}`);
                reject(err);
            }

        });
    }


    jwtEncode(payload) {
        return new Promise((resolve, reject) => {
            if (!payload || !payload._id) return reject('Missing parameter in payload #jwtEncode on coreCtrl.js');
            return resolve(jwt.sign({ _id: payload._id }, process.env.JWT_PASS, {
                expiresIn: '30m'
            }));
        })
    }

    jwtDecode(payload) {
        return new Promise((resolve, reject) => {
            if (!payload || !payload.token) return reject('Missing parameter in payload #jwtDecode on coreCtrl.js');

            return jwt.verify(payload.token, process.env.JWT_PASS, (err, user) => {
                if (err) return reject('The token was expired or invalid');
                return resolve(user);
            });
        })
    }

    generateRefreshToken = (user) => {
        return new Promise((resolve) => {
            resolve(jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1y' }));
        })
    }

    authenticateJWT = (req, res, next) => {
        const authHeader = req.headers.authorization;

        if (authHeader) {
            const token = authHeader.split(' ')[1];

            jwt.verify(token, process.env.JWT_PASS, (err, user) => {
                if (err) {
                    return res.sendStatus(401);
                }

                req.user = user;
                next();
            });
        } else {
            res.sendStatus(401);
        }
    };

    authenticateRefreshToken = (req, res, next) => {
        return new Promise((resolve, reject) => {
            const authHeader = req.headers['authorization']
            let token = authHeader && authHeader.split(' ')[1]
            if (token == null) return reject(401)
            // If many token on header, get the first only

            jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
                if (err) {
                    return reject(401)
                }

                const userOverides = { '_id': user['_id:'] };
                // TODO: Check en base que l'user est toujours existant/autorisé à utiliser la plateforme
                const refreshedToken = this.jwtEncode(userOverides);
                resolve({
                    accessToken: refreshedToken,
                });
            });
        })

    }
}

module.exports = Core;