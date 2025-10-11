import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import bcrypt from "bcrypt";
import * as userModel from "../models/userModel.js";

passport.use(
  new LocalStrategy({ session: false }, (username, password, done) => {
    const asyncHandler = async () => {
      try {
        const user = await userModel.getUserRecordByUsername(username);

        if (!user) {
          done(null, false, { message: "Incorrect username or password." });
          return;
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
          done(null, false, { message: "Incorrect username or password." });
          return;
        }

        done(null, user);
      } catch (error) {
        done(error);
      }
    };

    void asyncHandler();
  })
);

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.SECRET_KEY,
    },
    (payload: { sub: string }, done) => {
      const asyncHandler = async () => {
        try {
          const user = await userModel.getUserRecordById(payload.sub);

          if (!user) {
            done(null, false);
            return;
          }

          done(null, user);
        } catch (error) {
          done(error);
        }
      };

      void asyncHandler();
    }
  )
);
