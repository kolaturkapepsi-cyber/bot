const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Guild = require('../database/models/Guild');
const config = require('../../config');

module.exports = {
  name: 'antiraid',
  description: 'AntiRaid sistemini yönet',
  usage: '!antiraid <on|off|status|set|whitelist|logchannel>',
  permissions: [PermissionFlagsBits.Administrator],

  async execute(message, args, antiRaid) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ Bu komutu kullanmak için **Administrator** yetkisine ihtiyacınız var.');
    }

    const sub = args[0]?.toLowerCase();

    if (!sub || sub === 'status') {
      return this.showStatus(message, antiRaid);
    }

    switch (sub) {
      case 'on':
        return this.toggle(message, true);
      case 'off':
        return this.toggle(message, false);
      case 'set':
        return this.setOption(message, args.slice(1));
      case 'whitelist':
        return this.manageWhitelist(message, args.slice(1));
      case 'logchannel':
        return this.setLogChannel(message, args.slice(1));
      case 'action':
        return this.setAction(message, args[1]);
      default:
        return message.reply(`❓ Geçersiz alt komut. Kullanım: \`${config.prefix}antiraid <on|off|status|set|whitelist|logchannel|action>\``);
    }
  },

  async showStatus(message, antiRaid) {
    const guildData = await antiRaid.getGuildData(message.guild.id);
    const ar = guildData.antiRaid;
    const stats = guildData.stats;

    const embed = new EmbedBuilder()
      .setColor(ar.enabled ? config.successColor : config.errorColor)
      .setTitle('🛡️ AntiRaid Sistemi Durumu')
      .setThumbnail(message.guild.iconURL())
      .addFields(
        { name: '🔌 Durum', value: ar.enabled ? '✅ Aktif' : '❌ Pasif', inline: true },
        { name: '🔒 Lockdown', value: ar.lockdown ? '🔴 Aktif' : '🟢 Pasif', inline: true },
        { name: '⚡ İşlem', value: ar.action.toUpperCase(), inline: true },
        { name: '👥 Join Eşiği', value: `${ar.joinThreshold} kullanıcı / ${ar.joinInterval/1000}s`, inline: true },
        { name: '🗑️ Spam Eşiği', value: `${ar.spamThreshold} mesaj / ${ar.spamInterval/1000}s`, inline: true },
        { name: '📢 Mention Eşiği', value: `${ar.mentionThreshold} mention / ${ar.mentionInterval/1000}s`, inline: true },
        { name: '📁 Kanal Eşiği', value: `${ar.channelThreshold} işlem / ${ar.channelInterval/1000}s`, inline: true },
        { name: '👶 Hesap Yaşı', value: `${ar.newAccountAge} gün`, inline: true },
        { name: '📋 Log Kanalı', value: ar.logChannel ? `<#${ar.logChannel}>` : 'Ayarlanmadı', inline: true },
        { name: '📊 İstatistikler', value: [
          `🚨 Engellenen Raid: **${stats.totalRaidsBlocked}**`,
          `🗑️ Engellenen Spam: **${stats.totalSpamBlocked}**`,
          `🔨 Toplam Ban: **${stats.totalBans}**`,
          `👢 Toplam Kick: **${stats.totalKicks}**`,
        ].join('\n'), inline: false },
      )
      .setTimestamp()
      .setFooter({ text: 'AntiRaid Sistemi • Dashboard: http://localhost:3000' });

    message.reply({ embeds: [embed] });
  },

  async toggle(message, state) {
    await Guild.findOneAndUpdate(
      { guildId: message.guild.id },
      { 'antiRaid.enabled': state },
      { upsert: true }
    );
    const embed = new EmbedBuilder()
      .setColor(state ? config.successColor : config.errorColor)
      .setDescription(state ? '✅ AntiRaid sistemi **aktif edildi**.' : '❌ AntiRaid sistemi **devre dışı bırakıldı**.');
    message.reply({ embeds: [embed] });
  },

  async setOption(message, args) {
    // !antiraid set <seçenek> <değer>
    // Örnek: !antiraid set joinThreshold 10
    const validOptions = ['joinThreshold', 'joinInterval', 'spamThreshold', 'spamInterval',
      'mentionThreshold', 'mentionInterval', 'channelThreshold', 'channelInterval', 'newAccountAge'];

    const option = args[0];
    const value = parseInt(args[1]);

    if (!validOptions.includes(option) || isNaN(value) || value < 1) {
      return message.reply(`❓ Geçerli seçenekler: \`${validOptions.join(', ')}\`\nKullanım: \`!antiraid set <seçenek> <sayı>\``);
    }

    await Guild.findOneAndUpdate(
      { guildId: message.guild.id },
      { [`antiRaid.${option}`]: value },
      { upsert: true }
    );

    const embed = new EmbedBuilder()
      .setColor(config.successColor)
      .setDescription(`✅ **${option}** değeri **${value}** olarak ayarlandı.`);
    message.reply({ embeds: [embed] });
  },

  async manageWhitelist(message, args) {
    // !antiraid whitelist add/remove @user/roleId
    const action = args[0]?.toLowerCase();
    const target = message.mentions.users.first() || message.mentions.roles.first();

    if (!action || !target || !['add', 'remove'].includes(action)) {
      return message.reply('❓ Kullanım: `!antiraid whitelist <add|remove> <@kullanıcı|@rol>`');
    }

    const field = target.constructor.name === 'User' ? 'antiRaid.whitelistedUsers' : 'antiRaid.whitelistedRoles';
    const update = action === 'add'
      ? { $addToSet: { [field]: target.id } }
      : { $pull: { [field]: target.id } };

    await Guild.findOneAndUpdate({ guildId: message.guild.id }, update, { upsert: true });

    const embed = new EmbedBuilder()
      .setColor(config.successColor)
      .setDescription(`✅ **${target.tag || target.name}** whitelist'e ${action === 'add' ? 'eklendi' : 'çıkarıldı'}.`);
    message.reply({ embeds: [embed] });
  },

  async setLogChannel(message, args) {
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);

    if (!channel) {
      return message.reply('❓ Kullanım: `!antiraid logchannel #kanal`');
    }

    await Guild.findOneAndUpdate(
      { guildId: message.guild.id },
      { 'antiRaid.logChannel': channel.id },
      { upsert: true }
    );

    const embed = new EmbedBuilder()
      .setColor(config.successColor)
      .setDescription(`✅ Log kanalı ${channel} olarak ayarlandı.`);
    message.reply({ embeds: [embed] });
  },

  async setAction(message, action) {
    const validActions = ['ban', 'kick', 'mute', 'lockdown'];
    if (!action || !validActions.includes(action.toLowerCase())) {
      return message.reply(`❓ Geçerli işlemler: \`${validActions.join(', ')}\`\nKullanım: \`!antiraid action <işlem>\``);
    }

    await Guild.findOneAndUpdate(
      { guildId: message.guild.id },
      { 'antiRaid.action': action.toLowerCase() },
      { upsert: true }
    );

    const embed = new EmbedBuilder()
      .setColor(config.successColor)
      .setDescription(`✅ Ceza işlemi **${action.toUpperCase()}** olarak ayarlandı.`);
    message.reply({ embeds: [embed] });
  }
};
