const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'ban',
  aliases: ['yasakla'],
  description: 'Belirtilen kullanıcıyı sunucudan banlar.',
  usage: '!ban @kullanıcı [sebep]',

  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('❌ **Ban Members** yetkisine sahip değilsin.');
    }
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('❌ Botun **Ban Members** yetkisi yok.');
    }

    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Kullanım: `!ban @kullanıcı [sebep]`');

    if (target.id === message.author.id) return message.reply('❌ Kendini banlayamazsın.');
    if (!target.bannable) return message.reply('❌ Bu kullanıcıyı banlayamam. Rolü benden yüksek olabilir.');

    const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';

    try {
      await target.ban({ reason: `${message.author.tag} tarafından: ${reason}`, deleteMessageSeconds: 7 * 24 * 3600 });

      const embed = new EmbedBuilder()
        .setColor(config.errorColor)
        .setTitle('🔨 Kullanıcı Banlandı')
        .setThumbnail(target.user.displayAvatarURL())
        .addFields(
          { name: '👤 Kullanıcı', value: `${target.user.tag} (${target.id})`, inline: true },
          { name: '👮 Yetkili', value: message.author.tag, inline: true },
          { name: '📝 Sebep', value: reason, inline: false },
        )
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (err) {
      message.reply(`❌ Ban işlemi başarısız: \`${err.message}\``);
    }
  },
};
