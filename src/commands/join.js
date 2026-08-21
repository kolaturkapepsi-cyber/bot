const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');

module.exports = {
  name: 'join',
  aliases: ['gel', 'bağlan'],
  description: 'Botu bulunduğun ses kanalına bağlar.',
  usage: '!join',

  async execute(message) {
    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) return message.reply('❌ Önce bir ses kanalına gir!');

    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return message.reply('❌ Bu ses kanalına bağlanmak için iznim yok!');
    }

    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
        selfDeaf: true,
      });
      await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
      message.reply(`✅ **${voiceChannel.name}** kanalına bağlandım!`);
    } catch (err) {
      message.reply(`❌ Bağlanılamadı: \`${err.message}\``);
    }
  },
};
