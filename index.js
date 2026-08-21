require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const connectDB = require('./src/database/connect');
const AntiRaid = require('./src/antiraid/AntiRaid');
const Guild = require('./src/database/models/Guild');
const config = require('./config');
const { initDistube } = require('./src/music/MusicPlayer');

// ─────────────────────────────────────────────
// CLIENT KURULUMU
// ─────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates, // Müzik için gerekli
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

// Komutları yükle
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'src', 'commands');
fs.readdirSync(commandsPath).filter(f => f.endsWith('.js')).forEach(file => {
  const cmd = require(path.join(commandsPath, file));
  client.commands.set(cmd.name, cmd);
  // Alias varsa onları da kaydet
  if (cmd.aliases && Array.isArray(cmd.aliases)) {
    cmd.aliases.forEach(alias => client.commands.set(alias, cmd));
  }
  console.log(`📦 Komut yüklendi: ${cmd.name}${cmd.aliases ? ` (aliases: ${cmd.aliases.join(', ')})` : ''}`);
});

const antiRaid = new AntiRaid(client);

// DisTube müzik sistemini başlat
initDistube(client);

// Dashboard'u başlat
const startDashboard = require('./src/dashboard/server');




client.once('ready', async () => {
  console.log(`\n✅ ${client.user.tag} olarak giriş yapıldı!`);
  console.log(`📡 ${client.guilds.cache.size} sunucuda aktif\n`);

  client.user.setPresence({
    activities: [{ name: '🛡️ Raid Koruma Aktif | !help', type: 3 }],
    status: 'online',
  });

  // Dashboard başlat
  startDashboard(client, antiRaid);
});

// ─────────────────────────────────────────────
// YENİ ÜYE KATILDI — JOIN RAID KONTROLÜ
// ─────────────────────────────────────────────
client.on('guildMemberAdd', async (member) => {
  try {
    await antiRaid.checkJoinRaid(member);
  } catch (err) {
    console.error('guildMemberAdd hata:', err.message);
  }
});

// ─────────────────────────────────────────────
// MESAJ ALINDI — SPAM / MENTION SPAM KONTROLÜ
// ─────────────────────────────────────────────
client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.bot) return;

  // Spam kontrol
  try {
    await antiRaid.checkSpam(message);
    await antiRaid.checkMentionSpam(message);
  } catch (err) {
    console.error('messageCreate antiRaid hata:', err.message);
  }

  // Sa → Aleyküm Selam
  if (message.content.toLowerCase() === 'sa') {
    return message.reply('Aleyküm selam kardeşim! 👋');
  }

  // Prefix kontrolü
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
// KANAL OLUŞTURULDU/SİLİNDİ — KANAL SPAM
// ─────────────────────────────────────────────
client.on('channelCreate', async (channel) => {
  if (!channel.guild) return;
  try {
    const logs = await channel.guild.fetchAuditLogs({ type: 10, limit: 1 }); // CHANNEL_CREATE
    const entry = logs.entries.first();
    if (!entry) return;
    const guildData = await antiRaid.getGuildData(channel.guild.id);
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
    const logs = await channel.guild.fetchAuditLogs({ type: 12, limit: 1 }); // CHANNEL_DELETE
    const entry = logs.entries.first();
    if (!entry) return;
    const guildData = await antiRaid.getGuildData(channel.guild.id);
    if (!guildData.antiRaid.enabled) return;
    await antiRaid.checkChannelSpam(channel.guild, entry.executor.id, guildData);
  } catch (err) {
    console.error('channelDelete hata:', err.message);
  }
});

// ─────────────────────────────────────────────
// SUNUCUYA KATILINDI
// ─────────────────────────────────────────────
client.on('guildCreate', async (guild) => {
  console.log(`➕ Yeni sunucu: ${guild.name} (${guild.id})`);
  try {
    await Guild.findOneAndUpdate(
      { guildId: guild.id },
      { guildId: guild.id, guildName: guild.name },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('guildCreate DB hatası:', err.message);
  }
});

// ─────────────────────────────────────────────
// HATA YÖNETİMİ
// ─────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

// ─────────────────────────────────────────────
// BAŞLAT
// ─────────────────────────────────────────────
(async () => {
  await connectDB();
  await client.login(process.env.BOT_TOKEN);
})();

module.exports = { client, antiRaid };
