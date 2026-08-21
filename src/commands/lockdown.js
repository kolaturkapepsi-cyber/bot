const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'lockdown',
  description: 'Sunucu lockdown modunu aç/kapat',
  usage: '!lockdown <on|off>',
  permissions: [PermissionFlagsBits.Administrator],

  async execute(message, args, antiRaid) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ Bu komutu kullanmak için **Administrator** yetkisine ihtiyacınız var.');
    }

    const sub = args[0]?.toLowerCase();
    const guildData = await antiRaid.getGuildData(message.guild.id);

    if (sub === 'on') {
      if (guildData.antiRaid.lockdown) {
        return message.reply('⚠️ Lockdown zaten aktif!');
      }
      await antiRaid.enableLockdown(message.guild, guildData);
      const embed = new EmbedBuilder()
        .setColor(config.errorColor)
        .setTitle('🔒 Lockdown Aktif!')
        .setDescription('Sunucu kilitlendi. Yeni üyeler katılamaz ve mesaj gönderilemez.\nKilidini açmak için: `!lockdown off`')
        .setTimestamp();
      message.reply({ embeds: [embed] });

    } else if (sub === 'off') {
      if (!guildData.antiRaid.lockdown) {
        return message.reply('⚠️ Lockdown zaten kapalı!');
      }
      await antiRaid.disableLockdown(message.guild, guildData);
      const embed = new EmbedBuilder()
        .setColor(config.successColor)
        .setTitle('🔓 Lockdown Kaldırıldı!')
        .setDescription('Sunucu kilidi açıldı. Her şey normale döndü.')
        .setTimestamp();
      message.reply({ embeds: [embed] });

    } else {
      const embed = new EmbedBuilder()
        .setColor(config.warnColor)
        .setTitle('🔒 Lockdown Durumu')
        .setDescription(`Şu an: ${guildData.antiRaid.lockdown ? '🔴 **AKTİF**' : '🟢 **PASİF**'}`)
        .addFields({ name: 'Kullanım', value: '`!lockdown on` - Kilitle\n`!lockdown off` - Kilidi aç' });
      message.reply({ embeds: [embed] });
    }
  }
};
