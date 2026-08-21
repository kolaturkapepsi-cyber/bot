const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'unmute',
  aliases: ['unsustur'],
  description: 'Kullanıcının timeout\'unu kaldırır.',
  usage: '!unmute @kullanıcı',

  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('❌ **Timeout Members** yetkisine sahip değilsin.');
    }
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('❌ Botun **Timeout Members** yetkisi yok.');
    }

    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Kullanım: `!unmute @kullanıcı`');

    if (!target.isCommunicationDisabled()) {
      return message.reply('❌ Bu kullanıcı zaten susturulmamış.');
    }

    try {
      await target.timeout(null, `${message.author.tag} tarafından timeout kaldırıldı`);

      const embed = new EmbedBuilder()
        .setColor(config.successColor)
        .setTitle('🔊 Timeout Kaldırıldı')
        .addFields(
          { name: '👤 Kullanıcı', value: `${target.user.tag} (${target.id})`, inline: true },
          { name: '👮 Yetkili', value: message.author.tag, inline: true },
        )
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (err) {
      message.reply(`❌ Unmute işlemi başarısız: \`${err.message}\``);
    }
  },
};
