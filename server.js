const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');
const cors = require('cors');
const https = require('https');
const http = require('http');
const fs = require('fs');
const { sequelize } = require('./db');
const defineSiteContent = require('./models/siteContent');
const SiteContent = defineSiteContent(sequelize);
const config = require('./config.json');

const app = express();

app.use(cors());

// Session config
app.use(session({
  secret: 'super-secret-key',
  resave: false,
  saveUninitialized: false
}));

// Passport config
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
  clientID: config.clientId,
  clientSecret: config.clientSecret,
  callbackURL: config.callbackURL,
  scope: ['identify']
}, (accessToken, refreshToken, profile, done) => {
  console.log("Access Token:", accessToken);
  console.log("Refresh Token:", refreshToken);
  console.log("Profile:", profile);
  process.nextTick(() => done(null, profile));
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/api/content/:section', async (req, res) => {
  const section = req.params.section;
  try {
    const content = await SiteContent.findOne({ where: { section } });
    if (!content) {
      console.warn(`[WARN] No content found for section: ${section}`);
      return res.status(404).json({ error: 'Content not found' });
    }
    res.json(content);
  } catch (err) {
    console.error('[ERROR] Failed to fetch content:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback', (req, res, next) => {
  passport.authenticate('discord', (err, user, info) => {
    if (err) {
      console.error("OAuth2 Error:", err);
      console.error("OAuth2 Info:", info);
      return res.status(500).send("OAuth2 Error: " + err.message);
    }
    if (!user) return res.redirect('/');
    req.logIn(user, (err) => {
      if (err) {
        console.error("Login Error:", err);
        return res.status(500).send("Login Error");
      }
      return res.redirect('/member');
    });
  })(req, res, next);
});

function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}

app.get('/member', ensureAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'member.html'));
});

app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

const PORT = process.env.PORT || 3000;
const keyPath = process.env.HTTPS_KEY_PATH || 'key.pem';
const certPath = process.env.HTTPS_CERT_PATH || 'cert.pem';
const HTTP_ONLY = process.env.HTTP_ONLY === 'true';

if (HTTP_ONLY) {
  http.createServer(app).listen(PORT, () => {
    console.log(`🚀 HTTP server running on port ${PORT}`);
  });
} else if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };

  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`🚀 HTTPS server running on port ${PORT}`);
  });
} else {
  // Integrate Greenlock if no local certs are found
  require('greenlock-express').init({
    packageRoot: __dirname,
    configDir: './greenlock.d',
    maintainerEmail: 'you@example.com',
    cluster: false
  }).serve(app);
}
