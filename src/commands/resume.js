const { getDistube } = require('../music/MusicPlayer');

module.exports = {
  name: 'resume',
  aliases: ['devam', 'r'],
  description: 'Duraklatılmış şarkıyı devam ettirir.',
  usage: '!resume',

  async execute(message) {
    const distube = getDistube();
    const queue = distube.getQueue(message.guild.id);

    if (!queue) return message.reply('❌ Şu an çalan bir şarkı yok.');
    if (!message.member?.voice?.channel) return message.reply('❌ Bir ses kanalında olman gerekiyor!');

    if (!queue.paused) return message.reply('❌ Şarkı zaten çalıyor.');

    try {
      distube.resume(message.guild.id);
      message.reply('▶️ Şarkı devam ediyor.');
    } catch (err) {
      message.reply(`❌ ${err.message}`);
    }
  },
};
