import { User } from "../models";
import { Router } from "express";
import sendMail from "../functions/email-sender";
import { DOMAIN } from "../constants";
import validator from "../middlewares/vaildator-middleware";
import { AuthenticateValidations, RegisterValidations } from "../validators";
import { randomBytes } from "crypto";
import { join } from "path";
import { userAuth } from "../middlewares/auth-guard";

const router = Router();

/**
 * @description To create a new user account
 * @access Public
 * @api /users/api/register
 * @type POST
 */
router.post(
  "/api/register",
  RegisterValidations,
  validator,
  async (req, res) => {
    try {
      let { username, email } = req.body;
      let user = await User.findOne({ username });
      if (user) {
        return res.status(400).json({
          success: false,
          message: "Username is already taken.",
        });
      }
      user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({
          success: false,
          message: "Email is already registered.",
        });
      }
      user = new User({
        ...req.body,
        verificationCode: randomBytes(20).toString("hex"),
      });
      await user.save();
      let html = `
        <h1>hello, ${user.username} </h1>
        <p>Please click the following link to verify your account</p>
        <a href="${DOMAIN}users/verify-now/${user.verificationCode}">Verify Now</a>
        `;
      sendMail(
        user.email,
        "Verify Account",
        "Please verify Your Account.",
        html
      );
      return res.status(201).json({
        success: true,
        message:
          "Hurray! your account is created please verify your email address.",
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "An error occurred.",
      });
    }
  }
);

/**
 * @description To verify a new user's account via email
 * @access Public <only via email>
 * @api /users/verify-now/verificationCode
 * @type GET
 */
router.get("/verify-now/:verificationCode", async (req, res) => {
  try {
    let { verificationCode } = req.params;
    let user = await User.findOne({ verificationCode });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access. Invalid verification code.",
      });
    }
    user.verified = true;
    user.verificationCode = undefined;
    await user.save();
    return res.sendFile(
      join(__dirname, "../templates/verification-success.html")
    );
  } catch (err) {
    return res.sendFile(join(__dirname, "../templates/errors.html"));
  }
});

/**
 * @description To authenticate an user and get auth token
 * @access Public
 * @api /users/api/authenticate
 * @type POST
 */
router.post(
  "/api/authenticate",
  AuthenticateValidations,
  validator,
  async (req, res) => {
    try {
      let { username, password } = req.body;
      let user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Username not found.",
        });
      }
      if (!(await user.comparePassword(password))) {
        return res.status(401).json({
          success: false,
          message: "Incorrect password.",
        });
      }
      let token = await user.generateJWT();
      return res.status(200).json({
        success: true,
        user: user.getUserInfo(),
        token: `Bearer ${token}`,
        message: "Hurray! you are now logged in.",
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "An error occurred.",
      });
    }
  }
);

/**
 * @description To get the authenticated user's profile
 * @access Private
 * @api /users/api/authenticate
 * @type GET
 */
router.get(
  "/api/authenticate",
  userAuth,
  async (req, res) => {
    return res.status(200).json({
      user: req.user
    });
  }
);

export default router;
