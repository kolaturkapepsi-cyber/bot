const music = require('../music/MusicPlayer');
module.exports = {
  name: 'pause', aliases: ['duraklat'],
  description: 'Şarkıyı duraklatır.', usage: '!pause',
  async execute(message) {
    const data = music.getQueue(message.guild.id);
    if (!data?.current) return message.reply('❌ Şu an çalan bir şarkı yok.');
    if (!message.member?.voice?.channel) return message.reply('❌ Ses kanalında olman gerekiyor!');
    music.pause(message.guild.id)
      ? message.reply('⏸️ Duraklatıldı.')
      : message.reply('❌ Zaten duraklatılmış.');
  },
};
