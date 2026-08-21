const musicPlayer = require('../music/MusicPlayer');

module.exports = {
  name: 'pause',
  aliases: ['duraklat'],
  description: 'Çalan şarkıyı duraklatır.',
  usage: '!pause',

  async execute(message) {
    const data = musicPlayer.getQueueList(message.guild.id);

    if (!data || !data.current) {
      return message.reply('❌ Şu an çalan bir şarkı yok.');
    }

    if (!message.member?.voice?.channel) {
      return message.reply('❌ Bir ses kanalında olman gerekiyor!');
    }

    const paused = musicPlayer.pause(message.guild.id);
    if (paused) {
      message.reply('⏸️ Şarkı duraklatıldı. Devam ettirmek için `!resume` kullan.');
    } else {
      message.reply('❌ Şarkı zaten duraklatılmış veya durdurulamadı.');
    }
  },
};
