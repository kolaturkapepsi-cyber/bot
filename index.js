require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs   = require('fs');
const path = require('path');
const AntiRaid = require('./src/antiraid/AntiRaid');
const db       = require('./src/database/JsonDB');
const config   = require('./config');

// data/guilds klasörünü oluştur (JsonDB zaten yapıyor ama garanti olsun)
const dataDir = path.join(__dirname, 'data', 'guilds');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// ─────────────────────────────────────────────
// CLIENT
// ─────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

// ─────────────────────────────────────────────
// KOMUT YÜKLEYİCİ
// ─────────────────────────────────────────────
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'src', 'commands');
fs.readdirSync(commandsPath).filter(f => f.endsWith('.js')).forEach(file => {
  const cmd = require(path.join(commandsPath, file));
  client.commands.set(cmd.name, cmd);
  if (cmd.aliases && Array.isArray(cmd.aliases)) {
    cmd.aliases.forEach(alias => client.commands.set(alias, cmd));
  }
  console.log(`📦 Komut yüklendi: ${cmd.name}${cmd.aliases ? ` (${cmd.aliases.join(', ')})` : ''}`);
});

const antiRaid = new AntiRaid(client);
const startDashboard = require('./src/dashboard/server');

// ─────────────────────────────────────────────
// READY
// ─────────────────────────────────────────────
client.once('ready', () => {
  console.log(`\n✅ ${client.user.tag} olarak giriş yapıldı!`);
  console.log(`📡 ${client.guilds.cache.size} sunucuda aktif\n`);
  client.user.setPresence({
    activities: [{ name: '🛡️ Raid Koruma Aktif | !help', type: 3 }],
    status: 'online',
  });
  startDashboard(client, antiRaid);
});

// ─────────────────────────────────────────────
// YENİ ÜYE
// ─────────────────────────────────────────────
client.on('guildMemberAdd', async (member) => {
  try { await antiRaid.checkJoinRaid(member); }
  catch (err) { console.error('guildMemberAdd hata:', err.message); }
});

// ─────────────────────────────────────────────
// MESAJ
// ─────────────────────────────────────────────
client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.bot) return;

  try {
    await antiRaid.checkSpam(message);
    await antiRaid.checkMentionSpam(message);
  } catch (err) {
    console.error('messageCreate antiRaid hata:', err.message);
  }

  if (message.content.toLowerCase() === 'sa') {
    return message.reply('Aleyküm selam kardeşim! 👋');
  }

  if (!message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args, antiRaid);
  } catch (err) {
    console.error(`Komut hatası (${commandName}):`, err.message);
    message.reply('❌ Komut çalıştırılırken bir hata oluştu.').catch(() => {});
  }
});

// ─────────────────────────────────────────────
// BAN KORUMASI
// ─────────────────────────────────────────────
client.on('guildBanAdd', async (ban) => {
  const protectedUsers = (process.env.PROTECTED_USERS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  if (!protectedUsers.includes(ban.user.id)) return;

  try {
    await ban.guild.members.unban(ban.user.id, '🛡️ Koruma aktif — otomatik unban');
    console.log(`🛡️ ${ban.user.tag} otomatik unban edildi.`);

    const guildData = db.findOne(ban.guild.id);
    const logChannelId = guildData?.antiRaid?.logChannel;
    if (logChannelId) {
      ban.guild.channels.cache.get(logChannelId)
        ?.send(`🛡️ **${ban.user.tag}** koruma altında, ban kaldırıldı.`).catch(() => {});
    }
  } catch (err) {
    console.error('Ban koruması hatası:', err.message);
  }
});

// ─────────────────────────────────────────────
// KANAL SPAM
// ─────────────────────────────────────────────
client.on('channelCreate', async (channel) => {
  if (!channel.guild) return;
  try {
    const logs = await channel.guild.fetchAuditLogs({ type: 10, limit: 1 });
    const entry = logs.entries.first();
    if (!entry) return;
    const guildData = antiRaid.getGuildData(channel.guild.id);
    if (!guildData.antiRaid.enabled) return;
    if (antiRaid.isWhitelisted({ id: entry.executor.id, permissions: null, roles: { cache: new Map() } }, guildData)) return;
    await antiRaid.checkChannelSpam(channel.guild, entry.executor.id, guildData);
  } catch (err) {
    console.error('channelCreate hata:', err.message);
  }
});

client.on('channelDelete', async (channel) => {
  if (!channel.guild) return;
  try {
    const logs = await channel.guild.fetchAuditLogs({ type: 12, limit: 1 });
    const entry = logs.entries.first();
    if (!entry) return;
    const guildData = antiRaid.getGuildData(channel.guild.id);
    if (!guildData.antiRaid.enabled) return;
    await antiRaid.checkChannelSpam(channel.guild, entry.executor.id, guildData);
  } catch (err) {
    console.error('channelDelete hata:', err.message);
  }
});

// ─────────────────────────────────────────────
// YENİ SUNUCU
// ─────────────────────────────────────────────
client.on('guildCreate', (guild) => {
  console.log(`➕ Yeni sunucu: ${guild.name} (${guild.id})`);
  db.findOneAndUpdate(guild.id, { guildName: guild.name });
});

// ─────────────────────────────────────────────
// HATA YÖNETİMİ
// ─────────────────────────────────────────────
process.on('unhandledRejection', (err) => console.error('Unhandled Rejection:', err.message));
process.on('uncaughtException',  (err) => console.error('Uncaught Exception:',  err.message));

// ─────────────────────────────────────────────
// BAŞLAT
// ─────────────────────────────────────────────
client.login(process.env.BOT_TOKEN);

module.exports = { client, antiRaid };
