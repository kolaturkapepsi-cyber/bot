const { getDistube } = require('../music/MusicPlayer');

module.exports = {
  name: 'play',
  aliases: ['p', 'çal'],
  description: 'YouTube\'dan şarkı çalar. URL veya arama terimi kullanabilirsiniz.',
  usage: '!play <şarkı adı veya YouTube URL>',

  async execute(message, args) {
    if (!args.length) {
      return message.reply('❌ Bir şarkı adı veya YouTube URL\'si gir.\n**Kullanım:** `!play <şarkı adı veya URL>`');
    }

    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) {
      return message.reply('❌ Bir ses kanalında olman gerekiyor!');
    }

    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return message.reply('❌ Bu ses kanalına bağlanmak veya konuşmak için iznim yok!');
    }

    const query = args.join(' ');
    const distube = getDistube();

    try {
      await distube.play(voiceChannel, query, {
        member: message.member,
        textChannel: message.channel,
        message,
      });
    } catch (err) {
      console.error('[play komutu]', err.message);
      message.reply(`❌ Hata: \`${err.message}\``);
    }
  },
};
