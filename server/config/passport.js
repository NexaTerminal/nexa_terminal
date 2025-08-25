const { ObjectId } = require("mongodb");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
const LocalStrategy = require("passport-local").Strategy;
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const bcrypt = require("bcryptjs");
const UserService = require("../services/userService");

// JWT options
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret_key',
};

module.exports = (db) => {
  const userService = new UserService(db);

  // JWT Strategy for token authentication
  passport.use(
    new JwtStrategy(jwtOptions, async (payload, done) => {
      try {
        const user = await userService.findById(payload.id);
        if (user) {
          return done(null, user);
        }
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    })
  );

  // Local Strategy for email/password authentication
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await userService.findByEmail(email);

          if (!user) {
            return done(null, false, { message: "User not found" });
          }

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: "Incorrect password" });
          }

          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  // Local Strategy for username/password authentication
  passport.use(
    'local-username',
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
      },
      async (username, password, done) => {
        try {
          const user = await userService.findByUsername(username);

          if (!user) {
            return done(null, false, { message: "User not found" });
          }

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: "Invalid credentials" });
          }

          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  // Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists by Google ID or email
          let user = await userService.findByGoogleId(profile.id);
          if (!user) {
            user = await userService.findByEmail(profile.emails[0].value);
          }

          if (user) {
            // Update user if needed
            if (!user.googleId) {
              await userService.updateUser(user._id, { googleId: profile.id });
              user.googleId = profile.id;
            }
            return done(null, user);
          }

          // Create new user
          const userData = {
            googleId: profile.id,
            email: profile.emails[0].value,
            profileComplete: false,
            isVerified: false,
            canPost: false
          };

          const newUser = await userService.createUser(userData);
          return done(null, newUser);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  // LinkedIn OAuth Strategy
  passport.use(
    new LinkedInStrategy(
      {
        clientID: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        callbackURL: process.env.LINKEDIN_CALLBACK_URL,
        scope: ["r_emailaddress", "r_liteprofile"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists by LinkedIn ID or email
          let user = await userService.findByLinkedInId(profile.id);
          if (!user) {
            user = await userService.findByEmail(profile.emails[0].value);
          }

          if (user) {
            // Update user if needed
            if (!user.linkedinId) {
              await userService.updateUser(user._id, { linkedinId: profile.id });
              user.linkedinId = profile.id;
            }
            return done(null, user);
          }

          // Create new user
          const userData = {
            email: profile.emails[0].value,
            profileComplete: false,
            isVerified: false,
            canPost: false
          };

          const newUser = await userService.createUser(userData);
          return done(null, newUser);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
};
