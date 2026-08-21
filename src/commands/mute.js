const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');

// Süre metnini ms'ye çevir: 10m → 600000, 1h → 3600000, 1d → 86400000
function parseDuration(str) {
  const match = str?.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const value = parseInt(match[1]);
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * units[match[2]];
}

module.exports = {
  name: 'mute',
  aliases: ['sustur', 'timeout'],
  description: 'Kullanıcıya timeout uygular.',
  usage: '!mute @kullanıcı <süre: 10m|1h|1d> [sebep]',

  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('❌ **Timeout Members** yetkisine sahip değilsin.');
    }
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('❌ Botun **Timeout Members** yetkisi yok.');
    }

    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Kullanım: `!mute @kullanıcı <10m|1h|1d> [sebep]`');

    if (target.id === message.author.id) return message.reply('❌ Kendine timeout uygulayamazsın.');
    if (!target.moderatable) return message.reply('❌ Bu kullanıcıya timeout uygulayamam.');

    const duration = parseDuration(args[1]);
    if (!duration) {
      return message.reply('❌ Geçerli süre formatı: `10s`, `5m`, `1h`, `1d`\nÖrnek: `!mute @kullanıcı 10m spam`');
    }

    // Maksimum Discord timeout süresi 28 gün
    if (duration > 28 * 24 * 3600000) {
      return message.reply('❌ Maksimum timeout süresi 28 gündür.');
    }

    const reason = args.slice(2).join(' ') || 'Sebep belirtilmedi';

    try {
      await target.timeout(duration, `${message.author.tag} tarafından: ${reason}`);

      const until = new Date(Date.now() + duration);
      const embed = new EmbedBuilder()
        .setColor(config.warnColor)
        .setTitle('🔇 Kullanıcı Susturuldu')
        .setThumbnail(target.user.displayAvatarURL())
        .addFields(
          { name: '👤 Kullanıcı', value: `${target.user.tag} (${target.id})`, inline: true },
          { name: '👮 Yetkili', value: message.author.tag, inline: true },
          { name: '⏱️ Süre', value: args[1], inline: true },
          { name: '🕐 Bitiş', value: `<t:${Math.floor(until.getTime() / 1000)}:R>`, inline: true },
          { name: '📝 Sebep', value: reason, inline: false },
        )
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (err) {
      message.reply(`❌ Mute işlemi başarısız: \`${err.message}\``);
    }
  },
};
