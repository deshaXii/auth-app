import { Schema, model } from "mongoose"
import { compare, hash } from "bcryptjs"
import { sign } from "jsonwebtoken"
import { SECERT } from "../constants"
import { randomBytes } from "crypto"
import { pick } from 'lodash'


const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    verificationCode: {
        type: String,
        required: false
    },
    resetPasswordToken: {
        type: String,
        required: false
    },
    resetPasswordExpiresIn: {
        type: Date,
        required: false
    }
}, { timestamps: true })


UserSchema.pre('save', async function (next) {
    let user = this;
    if(!user.isModified("password")) return next()
    user.password = await hash(user.password, 10)
    next()
})

UserSchema.methods.comparePassword = async function (password) {
    return await compare(password, this.password)
}

UserSchema.methods.generateJWT = async function () {
    let payload = {
        username: this.username,
        name: this.name,
        email: this.email,
        id: this._id
    }
    return await sign(payload, SECERT, { expiresIn: "1 day"})
}

UserSchema.methods.generatePasswordReset = function () {
    this.resetPasswordExpiresIn = Date.now() + 36000000
    this.resetPasswordToken = randomBytes(20).toString("hex")
}


UserSchema.methods.getUserInfo = function () {
    return pick(this, ["_id", "username", "email", "name", "verified"])
}

const User = model('users', UserSchema)

export default User