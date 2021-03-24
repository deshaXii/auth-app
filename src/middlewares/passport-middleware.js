import passport from "passport";
import { User } from "../models";
import { SECERT as secretOrKey } from "../constants";
import { Strategy, ExtractJwt } from "passport-jwt";

const options = {
  secretOrKey,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

passport.use(
  new Strategy(options, async ({ id }, done) => {
    try {
      let user = await User.findById(id);
      if (!user) {
        throw new Error("User not found.");
      }
      return done(null, user.getUserInfo())
    } catch (err) {
        done(null, false)
    }
  })
);
