const musicPlayer = require('../music/MusicPlayer');

module.exports = {
  name: 'stop',
  aliases: ['dc', 'leave', 'ayrıl'],
  description: 'Müziği durdurur, kuyruğu temizler ve ses kanalından ayrılır.',
  usage: '!stop',

  async execute(message) {
    const data = musicPlayer.getQueueList(message.guild.id);

    if (!data || (!data.current && data.queue.length === 0)) {
      return message.reply('❌ Şu an çalan bir şarkı yok.');
    }

    if (!message.member?.voice?.channel) {
      return message.reply('❌ Bir ses kanalında olman gerekiyor!');
    }

    musicPlayer.stop(message.guild.id);
    message.reply('⏹️ Müzik durduruldu ve kuyruk temizlendi.');
  },
};
