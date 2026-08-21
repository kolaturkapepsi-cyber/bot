const music = require('../music/MusicPlayer');
module.exports = {
  name: 'resume', aliases: ['devam', 'r'],
  description: 'Duraklatılan şarkıyı devam ettirir.', usage: '!resume',
  async execute(message) {
    const data = music.getQueue(message.guild.id);
    if (!data?.current) return message.reply('❌ Şu an çalan bir şarkı yok.');
    if (!message.member?.voice?.channel) return message.reply('❌ Ses kanalında olman gerekiyor!');
    music.resume(message.guild.id)
      ? message.reply('▶️ Devam ediyor.')
      : message.reply('❌ Zaten çalıyor.');
  },
};
