import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  OAUTH_CALLBACK_URL,
  ALLOWED_EMAIL_DOMAIN,
} = process.env;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: OAUTH_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const firstName = profile.name?.givenName || "";
        const lastName = profile.name?.familyName || "";
        const googleId = profile.id;

        // Optional: restrict by domain (like @gmail.com)
        if (ALLOWED_EMAIL_DOMAIN && !email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
          console.warn(`Unauthorized domain: ${email}`);
          return done(new Error("Unauthorized email domain"), null);
        }

        // 🔍 Check if user exists
        const result = await pool.query(
          "SELECT * FROM users WHERE google_id = $1 OR email = $2",
          [googleId, email]
        );

        let user = result.rows[0];

        if (!user) {
          // 🆕 Insert new Google user
          const insert = await pool.query(
            `INSERT INTO users (google_id, email, first_name, last_name, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             RETURNING *`,
            [googleId, email, firstName, lastName]
          );

          user = insert.rows[0];
          console.log(`🆕 Created new user: ${email}`);
        } else {
          // 🕒 Update their last login time
          await pool.query(
            "UPDATE users SET updated_at = NOW() WHERE id = $1",
            [user.id]
          );
        }

        done(null, user);
      } catch (err) {
        console.error("❌ GoogleStrategy Error:", err);
        done(err, null);
      }
    }
  )
);

// ✅ Serialize user into session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// ✅ Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
