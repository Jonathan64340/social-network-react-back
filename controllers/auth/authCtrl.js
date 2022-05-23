const beautifierConsole = require("../../utils/beautifierConsole");
const bcrypt = require('bcrypt');
const Core = require("../core/coreCtrl");
const { validateEmail } = require("../../utils/misc");

class Auth extends Core {
    db = undefined;

    init(db) {
        this.db = db;
    }

    login(payload) {
        return new Promise(async (resolve, reject) => {
            if (!payload || !payload.email || !payload.password) {
                reject('form.info.error_form.auth.not_found_account');
                return beautifierConsole('fgRed', 'Invalid or missing key in #login on authCtrl.js');
            }
            if (typeof this.db === 'undefined') return beautifierConsole('fgRed', 'The db is not init int #login on authCtrl.js');
            if (!validateEmail(payload.email)) {
                reject('form.info.invalid_field.email');
                return beautifierConsole('fgRed', 'The email wasn\'t valid');
            }

            const user = await this.db.collection('users').findOne({ email: payload.email });
            if (user) {
                const userDbPassword = user.password;
                const payloadPassword = payload.password;
                try {
                    bcrypt.compare(payloadPassword, userDbPassword, async (err, result) => {
                        if (result) {
                            const token = await this.jwtEncode({ "_id": user._id });
                            const refreshToken = await this.generateRefreshToken({ "_id:": user._id });
                            return resolve({ accessToken: token, refreshToken });
                        } else {
                            return reject('form.info.error_form.auth.not_found_account');
                        }
                    })
                } catch (err) {
                    return reject('Error occured on login. Maybe conflicted with #jwtEncode on coreCtrl.js');
                }
            } else {
                return reject('form.info.error_form.auth.not_found_account');
            }
        })
    }

    register(payload) {
        return new Promise(async (resolve, reject) => {
            if (!payload.username.length || !payload.email.length || !payload.password.length || !payload.firstname || !payload.lastname || !payload.sid) {
                reject('form.info.error_form.auth.error');
                return beautifierConsole('fgRed', 'Invalid or missing key in #register on authCtrl.js')
            };

            if (typeof this.db === 'undefined') return beautifierConsole('fgRed', 'The db is not init int #register on authCtrl.js');
            if (!validateEmail(payload.email)) {
                reject('form.info.invalid_field.email');
                return beautifierConsole('fgRed', 'The email wasn\'t valid');
            }
            const userAlreadyExist = await this.db.collection('users').count({ $or: [{ username: payload.username }, { email: payload.email }] });
            if (userAlreadyExist) {
                return reject('form.info.error_form.auth.duplicated_account');
            };

            try {
                const password = payload.password;
                bcrypt.genSalt(10, (err, salt) => {
                    if (err) return reject('Error occured on register #1.');
                    bcrypt.hash(password, salt, async (err, hash) => {
                        if (err) return reject('Error occured on register #2.');

                        if (hash) {
                            const newUser = await this.db.collection('users').insertOne({ username: payload.username, password: hash, email: payload.email, createdAt: new Date().getTime(), modifiedAt: new Date().getTime(), registration_date: new Date().getTime(), sid: payload.sid });
                            const token = await this.jwtEncode({ "_id": newUser.insertedId });
                            const refreshToken = await this.generateRefreshToken({ "_id:": newUser.insertedId });
                            return resolve({ accessToken: token, refreshToken, "user": newUser.insertedId });
                        } else {
                            return reject('Error occured on register #3.');
                        }

                    })
                });
            } catch (err) {
                return reject('form.info.error_form.auth.error_register');;
            }
        })

    }
}

module.exports = Auth;