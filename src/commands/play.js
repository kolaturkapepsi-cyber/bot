const music = require('../music/MusicPlayer');

module.exports = {
  name: 'play',
  aliases: ['p', 'çal'],
  description: 'YouTube\'dan şarkı çalar.',
  usage: '!play <şarkı adı veya URL>',

  async execute(message, args) {
    if (!args.length) return message.reply('❌ Kullanım: `!play <şarkı adı veya URL>`');

    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) return message.reply('❌ Bir ses kanalında olman gerekiyor!');

    const perms = voiceChannel.permissionsFor(message.client.user);
    if (!perms.has('Connect') || !perms.has('Speak'))
      return message.reply('❌ Bu ses kanalına bağlanmak için iznim yok!');

    const loading = await message.reply('🔎 Aranıyor...');
    try {
      const { song, isFirst } = await music.play(
        message.guild.id, voiceChannel, message.channel, args.join(' ')
      );
      song.requestedBy = message.author.username;

      if (!isFirst) {
        const data = music.getQueue(message.guild.id);
        const pos = data ? data.queue.length : 1;
        await loading.edit(`✅ **${song.title}** kuyruğa eklendi. (Sıra: #${pos})`);
      } else {
        await loading.delete().catch(() => {});
      }
    } catch (err) {
      console.error('[play]', err.message);
      await loading.edit(`❌ Hata: \`${err.message}\``);
    }
  },
};
