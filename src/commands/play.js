const { useMainPlayer } = require('discord-player');

module.exports = {
  name: 'play',
  aliases: ['p', 'çal'],
  description: 'YouTube\'dan şarkı çalar. URL veya arama terimi kullanabilirsiniz.',
  usage: '!play <şarkı adı veya YouTube URL>',

  async execute(message, args) {
    if (!args.length) {
      return message.reply('❌ Kullanım: `!play <şarkı adı veya URL>`');
    }

    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) return message.reply('❌ Bir ses kanalında olman gerekiyor!');

    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return message.reply('❌ Bu ses kanalına bağlanmak için iznim yok!');
    }

    const query = args.join(' ');
    const player = useMainPlayer();

    try {
      const { track } = await player.play(voiceChannel, query, {
        nodeOptions: {
          metadata: { channel: message.channel },
          selfDeaf: true,
          volume: 50,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 5000,
          leaveOnEnd: true,
          leaveOnEndCooldown: 5000,
        },
        requestedBy: message.author,
      });

      // playerStart eventi embed'i gönderiyor, sadece ilk şarkıda ek mesaj yok
      if (player.nodes.get(message.guild)?.tracks?.size > 0) {
        message.react('✅').catch(() => {});
      }
    } catch (err) {
      console.error('[play komutu]', err.message);
      message.reply(`❌ Hata: \`${err.message}\``);
    }
  },
};
