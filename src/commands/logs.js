const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database/JsonDB');
const config = require('../../config');

module.exports = {
  name: 'logs',
  description: 'AntiRaid loglarını görüntüle',
  usage: '!logs [sayı]',

  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('❌ **Sunucuyu Yönet** yetkisi gerekli.');
    }

    const limit = Math.min(parseInt(args[0]) || 10, 25);
    const guildData = db.findOne(message.guild.id);

    if (!guildData.logs.length) {
      return message.reply('📋 Henüz hiç log kaydı yok.');
    }

    const logs = guildData.logs.slice(-limit).reverse();
    const typeLabel = {
      raid_detected: '🚨 Raid',
      spam:          '🗑️ Spam',
      mention_spam:  '📢 Mention Spam',
      channel_spam:  '📁 Kanal Spam',
      new_account:   '👶 Yeni Hesap',
    };

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(`📋 AntiRaid Logları (Son ${logs.length})`)
      .setDescription(
        logs.map((log, i) =>
          `**${i+1}.** ${typeLabel[log.type] || '⚠️'} • \`${log.username}\` • **${log.action?.toUpperCase()}**\n` +
          `   └ ${log.reason} • <t:${Math.floor(new Date(log.timestamp).getTime()/1000)}:R>`
        ).join('\n\n')
      )
      .setTimestamp()
      .setFooter({ text: `Toplam ${guildData.logs.length} log` });

    message.reply({ embeds: [embed] });
  },
};
