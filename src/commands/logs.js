const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Guild = require('../database/models/Guild');
const config = require('../../config');
const moment = require('moment');

module.exports = {
  name: 'logs',
  description: 'AntiRaid loglarını görüntüle',
  usage: '!logs [sayı]',
  permissions: [PermissionFlagsBits.ManageGuild],

  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('❌ Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine ihtiyacınız var.');
    }

    const limit = Math.min(parseInt(args[0]) || 10, 25);
    const guildData = await Guild.findOne({ guildId: message.guild.id });

    if (!guildData || guildData.logs.length === 0) {
      return message.reply('📋 Henüz hiç log kaydı yok.');
    }

    const logs = guildData.logs.slice(-limit).reverse();

    const typeLabel = {
      raid_detected: '🚨 Raid',
      spam: '🗑️ Spam',
      mention_spam: '📢 Mention Spam',
      channel_spam: '📁 Kanal Spam',
      new_account: '👶 Yeni Hesap'
    };

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(`📋 AntiRaid Logları (Son ${logs.length})`)
      .setDescription(
        logs.map((log, i) =>
          `**${i + 1}.** ${typeLabel[log.type] || '⚠️'} • \`${log.username}\` • **${log.action?.toUpperCase()}**\n` +
          `   └ ${log.reason} • <t:${Math.floor(new Date(log.timestamp).getTime() / 1000)}:R>`
        ).join('\n\n')
      )
      .setTimestamp()
      .setFooter({ text: `Toplam ${guildData.logs.length} log • Dashboard'da daha fazlası: http://localhost:3000` });

    message.reply({ embeds: [embed] });
  }
};
