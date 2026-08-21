const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const MongoStore = require('connect-mongo');
const path = require('path');
const config = require('../../config');
const Guild = require('../database/models/Guild');

const app = express();

// ─────────────────────────────────────────────
// PASSPORT — DISCORD OAuth2
// ─────────────────────────────────────────────
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(new Strategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: config.dashboard.callbackUrl,
  scope: ['identify', 'guilds'],
}, (accessToken, refreshToken, profile, done) => {
  process.nextTick(() => done(null, profile));
}));

// ─────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: config.dashboard.secret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/antiraid-bot',
    touchAfter: 24 * 3600,
  }),
  cookie: { maxAge: 604800000 }, // 7 gün
}));

app.use(passport.initialize());
app.use(passport.session());

// Auth middleware
const isAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
};

// Admin kontrolü — sunucuda yönetici mi?
const isGuildAdmin = async (req, res, next) => {
  const { guildId } = req.params;
  const userGuild = req.user.guilds?.find(g => g.id === guildId);
  if (!userGuild) return res.status(403).render('error', { message: 'Bu sunucuya erişiminiz yok.', user: req.user });
  const hasAdmin = (BigInt(userGuild.permissions) & BigInt(0x8)) === BigInt(0x8);
  if (!hasAdmin) return res.status(403).render('error', { message: 'Bu sunucuyu yönetmek için Administrator yetkisi gereklidir.', user: req.user });
  next();
};

// ─────────────────────────────────────────────
// AUTH ROTASLARI
// ─────────────────────────────────────────────
app.get('/login', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/dashboard');
  res.render('login', { user: null });
});

app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/callback',
  passport.authenticate('discord', { failureRedirect: '/login' }),
  (req, res) => res.redirect('/dashboard')
);

app.get('/logout', (req, res) => {
  req.logout(() => res.redirect('/'));
});

// ─────────────────────────────────────────────
// ANA SAYFA
// ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.render('index', { user: req.user || null });
});

// ─────────────────────────────────────────────
// DASHBOARD — SUNUCU LİSTESİ
// ─────────────────────────────────────────────
app.get('/dashboard', isAuth, async (req, res) => {
  // Botun bulunduğu ve kullanıcının admin olduğu sunucular
  const client = req.app.get('discordClient');
  const userGuilds = req.user.guilds || [];

  const manageable = userGuilds.filter(g => {
    const hasAdmin = (BigInt(g.permissions) & BigInt(0x8)) === BigInt(0x8);
    return hasAdmin;
  });

  const botGuildIds = client ? [...client.guilds.cache.keys()] : [];
  const guilds = manageable.map(g => ({
    ...g,
    botIn: botGuildIds.includes(g.id),
  }));

  res.render('dashboard', { user: req.user, guilds });
});

// ─────────────────────────────────────────────
// SUNUCU AYARLARI SAYFASI
// ─────────────────────────────────────────────
app.get('/dashboard/:guildId', isAuth, isGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  const client = req.app.get('discordClient');

  let guildData = await Guild.findOne({ guildId });
  if (!guildData) {
    guildData = new Guild({ guildId });
    await guildData.save();
  }

  const discordGuild = client?.guilds.cache.get(guildId);
  const channels = discordGuild
    ? [...discordGuild.channels.cache.values()]
        .filter(c => c.type === 0) // TEXT kanallar
        .map(c => ({ id: c.id, name: c.name }))
    : [];

  const roles = discordGuild
    ? [...discordGuild.roles.cache.values()]
        .filter(r => !r.managed && r.name !== '@everyone')
        .map(r => ({ id: r.id, name: r.name }))
    : [];

  res.render('guild', {
    user: req.user,
    guildData,
    guildName: discordGuild?.name || guildId,
    guildIcon: discordGuild?.iconURL() || null,
    channels,
    roles,
    logs: guildData.logs.slice(-20).reverse(),
  });
});

// ─────────────────────────────────────────────
// API — AYAR KAYDET
// ─────────────────────────────────────────────
app.post('/api/guild/:guildId/settings', isAuth, isGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  const {
    enabled, action, lockdown,
    joinThreshold, joinInterval,
    spamThreshold, spamInterval,
    mentionThreshold, mentionInterval,
    channelThreshold, channelInterval,
    newAccountAge, logChannel,
  } = req.body;

  try {
    await Guild.findOneAndUpdate(
      { guildId },
      {
        'antiRaid.enabled': enabled === 'on',
        'antiRaid.action': action || 'ban',
        'antiRaid.lockdown': lockdown === 'on',
        'antiRaid.joinThreshold': parseInt(joinThreshold) || 5,
        'antiRaid.joinInterval': (parseInt(joinInterval) || 5) * 1000,
        'antiRaid.spamThreshold': parseInt(spamThreshold) || 5,
        'antiRaid.spamInterval': (parseInt(spamInterval) || 5) * 1000,
        'antiRaid.mentionThreshold': parseInt(mentionThreshold) || 5,
        'antiRaid.mentionInterval': (parseInt(mentionInterval) || 5) * 1000,
        'antiRaid.channelThreshold': parseInt(channelThreshold) || 3,
        'antiRaid.channelInterval': (parseInt(channelInterval) || 10) * 1000,
        'antiRaid.newAccountAge': parseInt(newAccountAge) || 7,
        'antiRaid.logChannel': logChannel || null,
      },
      { upsert: true }
    );
    res.json({ success: true, message: 'Ayarlar kaydedildi!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// API — LOCKDOWN TOGGLE
// ─────────────────────────────────────────────
app.post('/api/guild/:guildId/lockdown', isAuth, isGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  const { state } = req.body;
  const client = req.app.get('discordClient');

  try {
    const guildData = await Guild.findOne({ guildId });
    const discordGuild = client?.guilds.cache.get(guildId);

    if (discordGuild && guildData) {
      const antiRaid = req.app.get('antiRaid');
      if (state) {
        await antiRaid.enableLockdown(discordGuild, guildData);
      } else {
        await antiRaid.disableLockdown(discordGuild, guildData);
      }
    }

    res.json({ success: true, lockdown: state });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// API — İSTATİSTİKLER
// ─────────────────────────────────────────────
app.get('/api/guild/:guildId/stats', isAuth, isGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  try {
    const guildData = await Guild.findOne({ guildId });
    if (!guildData) return res.json({ stats: {}, logs: [] });

    // Son 7 gün için günlük log sayıları
    const now = Date.now();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const start = now - (i + 1) * 86400000;
      const end = now - i * 86400000;
      const count = guildData.logs.filter(l => {
        const t = new Date(l.timestamp).getTime();
        return t >= start && t < end;
      }).length;
      const d = new Date(now - i * 86400000);
      days.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, count });
    }

    res.json({ stats: guildData.stats, logs: guildData.logs.slice(-50).reverse(), days });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// API — LOG TEMİZLE
// ─────────────────────────────────────────────
app.post('/api/guild/:guildId/clear-logs', isAuth, isGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  try {
    await Guild.findOneAndUpdate({ guildId }, { $set: { logs: [] } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// SUNUCUYU BAŞLAT
// ─────────────────────────────────────────────
function startDashboard(client, antiRaid) {
  app.set('discordClient', client);
  app.set('antiRaid', antiRaid);

  const port = process.env.PORT || config.dashboard.port;
  app.listen(port, '0.0.0.0', () => {
    console.log(`🌐 Dashboard başlatıldı: http://0.0.0.0:${port}`);
  });
}

module.exports = startDashboard;
