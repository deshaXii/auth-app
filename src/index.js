import cors from "cors"
import consola from "consola"
import express from "express"
import mongoose from "mongoose"
import { json } from "body-parser"
import passport from "passport"

import { DB, PORT } from "./constants/index"

// router imports
import usersApi from './apis/users'
require("./middlewares/passport-middleware")

const app = express();

app.use(cors())
app.use(json())
app.use(passport.initialize())

app.use('/users', usersApi)


const main = async () => {
    try {
        await mongoose.connect(DB, {
            useFindAndModify: false,
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        consola.success("database connected...")
        app.listen(PORT, () => consola.success(`server started on ${PORT}`))
    } catch (err) {
        consola.error(`Unable to start the server \n ${err.message}`)
    }
}

main()