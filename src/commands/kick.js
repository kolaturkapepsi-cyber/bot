const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'kick',
  aliases: ['at'],
  description: 'Belirtilen kullanıcıyı sunucudan atar.',
  usage: '!kick @kullanıcı [sebep]',

  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply('❌ **Kick Members** yetkisine sahip değilsin.');
    }
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply('❌ Botun **Kick Members** yetkisi yok.');
    }

    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Kullanım: `!kick @kullanıcı [sebep]`');

    if (target.id === message.author.id) return message.reply('❌ Kendini atamazsın.');
    if (!target.kickable) return message.reply('❌ Bu kullanıcıyı atamam. Rolü benden yüksek olabilir.');

    const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';

    try {
      await target.kick(`${message.author.tag} tarafından: ${reason}`);

      const embed = new EmbedBuilder()
        .setColor(config.warnColor)
        .setTitle('👢 Kullanıcı Atıldı')
        .setThumbnail(target.user.displayAvatarURL())
        .addFields(
          { name: '👤 Kullanıcı', value: `${target.user.tag} (${target.id})`, inline: true },
          { name: '👮 Yetkili', value: message.author.tag, inline: true },
          { name: '📝 Sebep', value: reason, inline: false },
        )
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (err) {
      message.reply(`❌ Kick işlemi başarısız: \`${err.message}\``);
    }
  },
};
