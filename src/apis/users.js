import { User } from "../models";
import { Router } from "express";
import validator from "../middlewares/vaildator-middleware";
import { RegisterValidations } from "../validators";
import { randomBytes } from "crypto"

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
        verificationCode: randomBytes(20).toString("hex")
    })
    await user.save()
    // send 
  }
);

export default router;
