const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Guild = require('../database/models/Guild');
const config = require('../../config');

// Bellekte tutulan geçici veriler
const joinTracker = new Map();    // { guildId: [timestamp, timestamp, ...] }
const spamTracker = new Map();    // { guildId_userId: [{ content, timestamp }, ...] }
const mentionTracker = new Map(); // { guildId_userId: [timestamp, ...] }
const channelTracker = new Map(); // { guildId_userId: [timestamp, ...] }

class AntiRaid {
  constructor(client) {
    this.client = client;
  }

  // ─────────────────────────────────────────────
  // JOIN RAID KONTROLÜ
  // ─────────────────────────────────────────────
  async checkJoinRaid(member) {
    const guildData = await this.getGuildData(member.guild.id);
    if (!guildData.antiRaid.enabled) return;

    const guildId = member.guild.id;
    const now = Date.now();
    const { joinThreshold, joinInterval, newAccountAge } = guildData.antiRaid;

    // Lockdown modu aktifse yeni girişleri engelle
    if (guildData.antiRaid.lockdown) {
      await this.punish(member, member.guild, 'Lockdown modu aktif', 'kick', guildData);
      return;
    }

    // Whitelist kontrolü
    if (this.isWhitelisted(member, guildData)) return;

    // Yeni hesap kontrolü
    const accountAge = (now - member.user.createdTimestamp) / (1000 * 60 * 60 * 24);
    if (accountAge < newAccountAge) {
      await this.punish(member, member.guild, `Yeni hesap (${Math.floor(accountAge)} gün)`, 'kick', guildData);
      await this.log(member.guild, guildData, {
        type: 'new_account',
        userId: member.id,
        username: member.user.tag,
        reason: `Hesap ${Math.floor(accountAge)} günlük (limit: ${newAccountAge} gün)`,
        action: 'kick'
      });
      return;
    }

    // Join flood kontrolü
    if (!joinTracker.has(guildId)) joinTracker.set(guildId, []);
    const joins = joinTracker.get(guildId);
    joins.push(now);

    // Eski kayıtları temizle
    const filtered = joins.filter(t => now - t < joinInterval);
    joinTracker.set(guildId, filtered);

    if (filtered.length >= joinThreshold) {
      console.log(`⚠️ [RAID TESPİT] ${member.guild.name} - ${filtered.length} kullanıcı ${joinInterval/1000}s içinde katıldı!`);
      
      await this.enableLockdown(member.guild, guildData);
      await this.punish(member, member.guild, 'Raid saldırısı tespit edildi', guildData.antiRaid.action, guildData);
      
      await this.log(member.guild, guildData, {
        type: 'raid_detected',
        userId: member.id,
        username: member.user.tag,
        reason: `${filtered.length} kullanıcı ${joinInterval/1000}s içinde katıldı`,
        action: guildData.antiRaid.action
      });

      // İstatistik güncelle
      await Guild.findOneAndUpdate(
        { guildId: member.guild.id },
        { $inc: { 'stats.totalRaidsBlocked': 1 }, $set: { 'stats.lastRaidAt': new Date() } }
      );
    }
  }

  // ─────────────────────────────────────────────
  // SPAM KONTROLÜ
  // ─────────────────────────────────────────────
  async checkSpam(message) {
    if (!message.guild || message.author.bot) return;

    const guildData = await this.getGuildData(message.guild.id);
    if (!guildData.antiRaid.enabled) return;
    if (this.isWhitelisted(message.member, guildData)) return;

    const key = `${message.guild.id}_${message.author.id}`;
    const now = Date.now();
    const { spamThreshold, spamInterval } = guildData.antiRaid;

    if (!spamTracker.has(key)) spamTracker.set(key, []);
    const msgs = spamTracker.get(key);
    msgs.push({ content: message.content, timestamp: now });

    const filtered = msgs.filter(m => now - m.timestamp < spamInterval);
    spamTracker.set(key, filtered);

    if (filtered.length >= spamThreshold) {
      // Spam mesajlarını sil
      try {
        const messages = await message.channel.messages.fetch({ limit: 20 });
        const spamMsgs = messages.filter(m => m.author.id === message.author.id);
        await message.channel.bulkDelete(spamMsgs, true);
      } catch (e) { /* ignore */ }

      await this.punish(message.member, message.guild, 'Spam tespit edildi', guildData.antiRaid.action, guildData);
      
      await this.log(message.guild, guildData, {
        type: 'spam',
        userId: message.author.id,
        username: message.author.tag,
        reason: `${filtered.length} mesaj ${spamInterval/1000}s içinde gönderildi`,
        action: guildData.antiRaid.action
      });

      spamTracker.delete(key);

      await Guild.findOneAndUpdate(
        { guildId: message.guild.id },
        { $inc: { 'stats.totalSpamBlocked': 1 } }
      );
    }
  }

  // ─────────────────────────────────────────────
  // MENTION SPAM KONTROLÜ
  // ─────────────────────────────────────────────
  async checkMentionSpam(message) {
    if (!message.guild || message.author.bot) return;

    const guildData = await this.getGuildData(message.guild.id);
    if (!guildData.antiRaid.enabled) return;
    if (this.isWhitelisted(message.member, guildData)) return;

    const mentionCount = message.mentions.users.size + message.mentions.roles.size;
    if (mentionCount === 0) return;

    const key = `${message.guild.id}_${message.author.id}`;
    const now = Date.now();
    const { mentionThreshold, mentionInterval } = guildData.antiRaid;

    if (!mentionTracker.has(key)) mentionTracker.set(key, []);
    const mentions = mentionTracker.get(key);

    for (let i = 0; i < mentionCount; i++) mentions.push(now);
    const filtered = mentions.filter(t => now - t < mentionInterval);
    mentionTracker.set(key, filtered);

    if (filtered.length >= mentionThreshold) {
      try { await message.delete(); } catch (e) { /* ignore */ }

      await this.punish(message.member, message.guild, 'Mention spam tespit edildi', guildData.antiRaid.action, guildData);
      
      await this.log(message.guild, guildData, {
        type: 'mention_spam',
        userId: message.author.id,
        username: message.author.tag,
        reason: `${filtered.length} mention ${mentionInterval/1000}s içinde yapıldı`,
        action: guildData.antiRaid.action
      });

      mentionTracker.delete(key);
    }
  }

  // ─────────────────────────────────────────────
  // KANAL SPAM KONTROLÜ (kanal oluşturma/silme)
  // ─────────────────────────────────────────────
  async checkChannelSpam(guild, userId, guildData) {
    const key = `${guild.id}_${userId}`;
    const now = Date.now();
    const { channelThreshold, channelInterval } = guildData.antiRaid;

    if (!channelTracker.has(key)) channelTracker.set(key, []);
    const actions = channelTracker.get(key);
    actions.push(now);

    const filtered = actions.filter(t => now - t < channelInterval);
    channelTracker.set(key, filtered);

    if (filtered.length >= channelThreshold) {
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) return;

      await this.punish(member, guild, 'Kanal spam tespit edildi', 'ban', guildData);

      await this.log(guild, guildData, {
        type: 'channel_spam',
        userId,
        username: member.user.tag,
        reason: `${filtered.length} kanal işlemi ${channelInterval/1000}s içinde yapıldı`,
        action: 'ban'
      });

      channelTracker.delete(key);
    }
  }

  // ─────────────────────────────────────────────
  // CEZA UYGULA
  // ─────────────────────────────────────────────
  async punish(member, guild, reason, action, guildData) {
    if (!member || !guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) return;

    // Bot ve sunucu sahibini atlat
    if (member.id === guild.ownerId) return;
    if (member.user?.bot) return;

    try {
      switch (action) {
        case 'ban':
          await member.ban({ reason: `[AntiRaid] ${reason}` });
          await Guild.findOneAndUpdate({ guildId: guild.id }, { $inc: { 'stats.totalBans': 1 } });
          break;
        case 'kick':
          await member.kick(`[AntiRaid] ${reason}`);
          await Guild.findOneAndUpdate({ guildId: guild.id }, { $inc: { 'stats.totalKicks': 1 } });
          break;
        case 'mute':
          const muteRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');
          if (muteRole) {
            await member.roles.add(muteRole, `[AntiRaid] ${reason}`);
            await Guild.findOneAndUpdate({ guildId: guild.id }, { $inc: { 'stats.totalMutes': 1 } });
          } else {
            // Muted rol yoksa kick uygula
            await member.kick(`[AntiRaid] ${reason}`);
          }
          break;
        case 'lockdown':
          await this.enableLockdown(guild, guildData);
          break;
      }
      console.log(`🔨 [CEZA] ${member.user?.tag || member.id} - ${action} - ${reason}`);
    } catch (err) {
      console.error(`❌ Ceza uygulanamadı: ${err.message}`);
    }
  }

  // ─────────────────────────────────────────────
  // LOCKDOWN AKTİF/PASİF
  // ─────────────────────────────────────────────
  async enableLockdown(guild, guildData) {
    try {
      await Guild.findOneAndUpdate(
        { guildId: guild.id },
        { 'antiRaid.lockdown': true }
      );

      // @everyone rolünün sunucuya katılmasını engelle
      const everyoneRole = guild.roles.everyone;
      await everyoneRole.setPermissions(
        everyoneRole.permissions.remove(PermissionFlagsBits.SendMessages),
        '[AntiRaid] Lockdown aktif'
      );

      await this.sendAlert(guild, guildData, '🔒 **LOCKDOWN AKTİF!**\nRaid saldırısı tespit edildi. Sunucu kilitlendi!\nKilidini açmak için: `!lockdown off`', 'RED');
      console.log(`🔒 [LOCKDOWN] ${guild.name} kilitlendi!`);
    } catch (err) {
      console.error('Lockdown hatası:', err.message);
    }
  }

  async disableLockdown(guild, guildData) {
    try {
      await Guild.findOneAndUpdate(
        { guildId: guild.id },
        { 'antiRaid.lockdown': false }
      );

      const everyoneRole = guild.roles.everyone;
      await everyoneRole.setPermissions(
        everyoneRole.permissions.add(PermissionFlagsBits.SendMessages),
        '[AntiRaid] Lockdown kaldırıldı'
      );

      await this.sendAlert(guild, guildData, '🔓 **LOCKDOWN KALDIRILDI!**\nSunucu kilidi açıldı.', 'GREEN');
      console.log(`🔓 [LOCKDOWN] ${guild.name} kilidi açıldı!`);
    } catch (err) {
      console.error('Lockdown kaldırma hatası:', err.message);
    }
  }

  // ─────────────────────────────────────────────
  // LOG GÖNDER
  // ─────────────────────────────────────────────
  async log(guild, guildData, logEntry) {
    // Veritabanına kaydet (son 100 log tutulur)
    await Guild.findOneAndUpdate(
      { guildId: guild.id },
      {
        $push: {
          logs: {
            $each: [logEntry],
            $slice: -100
          }
        }
      }
    );

    // Log kanalına gönder
    const logChannelId = guildData.antiRaid.logChannel;
    if (!logChannelId) return;

    const channel = guild.channels.cache.get(logChannelId);
    if (!channel) return;

    const typeEmoji = {
      raid_detected: '🚨',
      spam: '🗑️',
      mention_spam: '📢',
      channel_spam: '📁',
      new_account: '👶'
    };

    const embed = new EmbedBuilder()
      .setColor(config.errorColor)
      .setTitle(`${typeEmoji[logEntry.type] || '⚠️'} AntiRaid Log`)
      .addFields(
        { name: '👤 Kullanıcı', value: `${logEntry.username} (\`${logEntry.userId}\`)`, inline: true },
        { name: '⚡ İşlem', value: logEntry.action?.toUpperCase() || 'Bilinmiyor', inline: true },
        { name: '📋 Sebep', value: logEntry.reason || 'Belirtilmedi', inline: false },
      )
      .setTimestamp()
      .setFooter({ text: 'AntiRaid Sistemi' });

    await channel.send({ embeds: [embed] }).catch(() => {});
  }

  // ─────────────────────────────────────────────
  // UYARI GÖNDER
  // ─────────────────────────────────────────────
  async sendAlert(guild, guildData, message, color) {
    const logChannelId = guildData.antiRaid.logChannel;
    if (!logChannelId) return;

    const channel = guild.channels.cache.get(logChannelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(color === 'RED' ? config.errorColor : config.successColor)
      .setDescription(message)
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(() => {});
  }

  // ─────────────────────────────────────────────
  // YARDIMCI FONKSİYONLAR
  // ─────────────────────────────────────────────
  async getGuildData(guildId) {
    let guild = await Guild.findOne({ guildId });
    if (!guild) {
      guild = new Guild({ guildId });
      await guild.save();
    }
    return guild;
  }

  isWhitelisted(member, guildData) {
    if (!member) return false;
    const { whitelistedRoles, whitelistedUsers } = guildData.antiRaid;

    if (whitelistedUsers.includes(member.id)) return true;
    if (member.roles?.cache.some(r => whitelistedRoles.includes(r.id))) return true;
    if (member.permissions?.has(PermissionFlagsBits.Administrator)) return true;

    return false;
  }
}

module.exports = AntiRaid;
