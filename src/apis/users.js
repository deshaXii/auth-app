import { User } from "../models";
import { Router } from "express";
import sendMail from "../functions/email-sender";
import { DOMAIN } from "../constants";
import validator from "../middlewares/vaildator-middleware";
import {
  AuthenticateValidations,
  RegisterValidations,
  ResetPassword,
} from "../validators";
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
router.get("/api/authenticate", userAuth, async (req, res) => {
  return res.status(200).json({
    user: req.user,
  });
});

/**
 * @description To initiate the password reset process
 * @access Public
 * @api /users/reset-password
 * @type PUT
 */
router.put(
  "/api/reset-password",
  ResetPassword,
  validator,
  async (req, res) => {
    try {
      let { email } = req.body;
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      user.generatePasswordReset();
      await user.save();
      // send password reset link in the email
      let html = `
        <h1>hello, ${user.username} </h1>
        <p>Please click the following link to reset your password</p>
        <p>if this password reset request is not created by your then you can ignore this email.</p>
        <a href="${DOMAIN}users/rest-password-now/${user.resetPasswordToken}">Verify Now</a>
        `;
      sendMail(user.email, "Reset Password", "Please Reset Password.", html);
      return res.status(200).json({
        success: true,
        message: "Password reset link is sent your email",
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "An error occurred",
      });
    }
  }
);

/**
 * @description To resender reset password page
 * @access Restricted via email
 * @api /users/reset-password-now/:resetPasswordToken
 * @type GET
 */
router.get("/rest-password-now/:resetPasswordToken", async (req, res) => {
  try {
    let { resetPasswordToken } = req.params;
    let user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpiresIn: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Password reset token is invalid or has expired.",
      });
    }
    return res.sendFile(join(__dirname, "../templates/reset.html"));
  } catch (err) {
    return res.sendFile(join(__dirname, "../templates/errors.html"));
  }
});

/**
 * @description To rest password
 * @access Restricted via email
 * @api /users/api/reset-password-now
 * @type POST
 */
router.post("/reset-password-now", async (req, res) => {
  try {
    let { resetPasswordToken, password } = req.body;
    let user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpiresIn: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Password reset token is invalid or has expired.",
      });
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresIn = undefined;
    await user.save();
    //  send notification email about the password reset successfull process
    let html = `
        <h1>hello, ${user.username} </h1>
        <p>your password is reset successfully.</p>
        <p>if this reset is not done by you then you can contact our team.</p>
        `;
    sendMail(
      user.email,
      "Reset Password successfull",
      "Your password is changed.",
      html
    );
    return res.status(200).json({
      success: true,
      message:
        "Your password reset request is complete and your password changed",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message:
        "Something wrong happend.",
    });
  }
});

export default router;
