const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
module.exports = {
  name: 'join', aliases: ['gel', 'bağlan'],
  description: 'Ses kanalına bağlanır.', usage: '!join',
  async execute(message) {
    const vc = message.member?.voice?.channel;
    if (!vc) return message.reply('❌ Bir ses kanalına gir!');
    const perms = vc.permissionsFor(message.client.user);
    if (!perms.has('Connect') || !perms.has('Speak')) return message.reply('❌ Kanalda iznim yok!');
    try {
      const conn = joinVoiceChannel({ channelId: vc.id, guildId: message.guild.id, adapterCreator: message.guild.voiceAdapterCreator, selfDeaf: true });
      await entersState(conn, VoiceConnectionStatus.Ready, 10_000);
      message.reply(`✅ **${vc.name}** kanalına bağlandım!`);
    } catch (err) {
      message.reply(`❌ \`${err.message}\``);
    }
  },
};
