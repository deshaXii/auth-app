import { Router } from "express";
import { userAuth } from "../middlewares/auth-guard";
import { Profile } from "../models";
import { User } from "../models";
import uploader from "../middlewares/uploader";
import { DOMAIN } from "../constants";

const router = Router();

/**
 * @description To create profile of the authenticated User
 * @access Private
 * @api /profiles/api/create-profile
 * @type POST <multipart-form> request
 */
router.post(
  "/api/create-profile",
  userAuth,
  uploader.single("avatar"),
  async (req, res) => {
    try {
      let { body, file, user } = req;
      let path = DOMAIN + file.path.split("uploads\\")[1];
      let profile = new Profile({
        social: body,
        account: user._id,
        avatar: path,
      });
      await profile.save();
      return res.status(201).json({
        success: true,
        message: "Profile created successfully.",
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Unable to create your profile.",
      });
    }
  }
);

/**
 * @description To get authenticated user's profile
 * @access Private
 * @api /profiles/api/my-profile
 * @type GET <multipart-form> request
 */
router.get("/api/my-profile", userAuth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ account: req.user._id }).populate(
      "account",
      "name email username"
    );
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Your profile is not available.",
      });
    }
    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Unable to get the profile.",
    });
  }
});

/**
 * @description To update authenticated user's profile
 * @access Private
 * @api /profiles/api/update-profile
 * @type PUT <multipart-form> request
 */
router.put(
  "/api/update-profile",
  uploader.single("avatar"),
  userAuth,
  async (req, res) => {
    try {
      let { body, file, user } = req;
      let path = DOMAIN + file.path.split("uploads\\")[1];
      let profile = await Profile.findOneAndUpdate(
        { account: user._id },
        { social: body, avatar: path },
        { new: true }
      );
      return res.status(200).json({
        success: true,
        profile,
        message: "Your profile is now updated",
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Unable to edit the profile.",
      });
    }
  }
);

/**
 * @description To get user's profile with the username
 * @access Public
 * @api /profiles/api/profile-user/:username
 * @type GET
 */
router.get("/api/profile-user/:username", async (req, res) => {
  try {
    let { username } = req.params;
    let user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User is not found.",
      });
    }
    let profile = await Profile.findOne({account: user._id})
    return res.status(200).json({
        success: true,
        profile: {
            ...profile.toObject(),
            account: user.getUserInfo()
        }
      });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Something went wrong.",
    });
  }
});

export default router;
