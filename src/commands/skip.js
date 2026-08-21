const { getDistube } = require('../music/MusicPlayer');

module.exports = {
  name: 'skip',
  aliases: ['s', 'geç'],
  description: 'Çalan şarkıyı atlayıp kuyruktaki sonraki şarkıya geçer.',
  usage: '!skip',

  async execute(message) {
    const distube = getDistube();
    const queue = distube.getQueue(message.guild.id);

    if (!queue) return message.reply('❌ Şu an çalan bir şarkı yok.');
    if (!message.member?.voice?.channel) return message.reply('❌ Bir ses kanalında olman gerekiyor!');

    try {
      const song = queue.songs[0];
      await distube.skip(message.guild.id);
      message.reply(`⏭️ **${song.name}** atlandı.`);
    } catch (err) {
      message.reply(`❌ ${err.message}`);
    }
  },
};
