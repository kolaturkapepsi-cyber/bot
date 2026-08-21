const { getDistube } = require('../music/MusicPlayer');

module.exports = {
  name: 'pause',
  aliases: ['duraklat'],
  description: 'Çalan şarkıyı duraklatır.',
  usage: '!pause',

  async execute(message) {
    const distube = getDistube();
    const queue = distube.getQueue(message.guild.id);

    if (!queue) return message.reply('❌ Şu an çalan bir şarkı yok.');
    if (!message.member?.voice?.channel) return message.reply('❌ Bir ses kanalında olman gerekiyor!');

    if (queue.paused) return message.reply('❌ Şarkı zaten duraklatılmış. Devam için `!resume` kullan.');

    try {
      distube.pause(message.guild.id);
      message.reply('⏸️ Şarkı duraklatıldı. Devam ettirmek için `!resume` kullan.');
    } catch (err) {
      message.reply(`❌ ${err.message}`);
    }
  },
};
