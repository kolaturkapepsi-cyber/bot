const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'unban',
  aliases: ['unban', 'yasakkaldır'],
  description: 'Belirtilen kullanıcının banını kaldırır.',
  usage: '!unban <kullanıcı ID> [sebep]',

  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('❌ **Ban Members** yetkisine sahip değilsin.');
    }
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('❌ Botun **Ban Members** yetkisi yok.');
    }

    const userId = args[0];
    if (!userId || !/^\d{17,19}$/.test(userId)) {
      return message.reply('❌ Kullanım: `!unban <kullanıcı ID> [sebep]`\nKullanıcı ID\'sini sağ tık → Kimliği Kopyala ile alabilirsin.');
    }

    const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';

    try {
      const banEntry = await message.guild.bans.fetch(userId).catch(() => null);
      if (!banEntry) return message.reply('❌ Bu kullanıcı sunucuda banlı değil.');

      await message.guild.members.unban(userId, `${message.author.tag} tarafından: ${reason}`);

      const embed = new EmbedBuilder()
        .setColor(config.successColor)
        .setTitle('✅ Ban Kaldırıldı')
        .addFields(
          { name: '👤 Kullanıcı', value: `${banEntry.user.tag} (${userId})`, inline: true },
          { name: '👮 Yetkili', value: message.author.tag, inline: true },
          { name: '📝 Sebep', value: reason, inline: false },
        )
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (err) {
      message.reply(`❌ Unban işlemi başarısız: \`${err.message}\``);
    }
  },
};
