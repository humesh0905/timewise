const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../db/knex');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const existingUser = await db('users').where({ email }).first();

        if (existingUser) return done(null, existingUser);

        const [user] = await db('users')
          .insert({
            email,
            first_name: profile.name.givenName,
            last_name: profile.name.familyName,
            google_id: profile.id,
            timezone: 'UTC',
          })
          .returning('*');

        done(null, user);
      } catch (err) {
        console.error('GoogleStrategy error:', err);
        done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await db('users').where({ id }).first();
  done(null, user);
});

module.exports = passport;
