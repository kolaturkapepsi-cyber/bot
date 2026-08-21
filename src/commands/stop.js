const { getDistube } = require('../music/MusicPlayer');

module.exports = {
  name: 'stop',
  aliases: ['dc', 'leave', 'ayrıl'],
  description: 'Müziği durdurur, kuyruğu temizler ve ses kanalından ayrılır.',
  usage: '!stop',

  async execute(message) {
    const distube = getDistube();
    const queue = distube.getQueue(message.guild.id);

    if (!queue) return message.reply('❌ Şu an çalan bir şarkı yok.');
    if (!message.member?.voice?.channel) return message.reply('❌ Bir ses kanalında olman gerekiyor!');

    try {
      await distube.stop(message.guild.id);
      message.reply('⏹️ Müzik durduruldu ve kuyruk temizlendi.');
    } catch (err) {
      message.reply(`❌ ${err.message}`);
    }
  },
};
