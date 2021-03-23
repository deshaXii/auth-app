import { config } from "dotenv"

config()

export const PORT  = process.env.PORT
export const SENDGRIDAPI  = process.env.SENDGRIDAPI
export const DB  = process.env.DB
export const HOST_EMAIL  = process.env.HOST_EMAIL
export const SECERT  = process.env.SECERT
export const DOMAIN  = process.env.DOMAIN