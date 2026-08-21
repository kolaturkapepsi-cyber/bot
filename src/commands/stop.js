const music = require('../music/MusicPlayer');
module.exports = {
  name: 'stop', aliases: ['dc'],
  description: 'Müziği durdurur ve kuyruğu temizler.', usage: '!stop',
  async execute(message) {
    const data = music.getQueue(message.guild.id);
    if (!data) return message.reply('❌ Şu an çalan bir şarkı yok.');
    if (!message.member?.voice?.channel) return message.reply('❌ Ses kanalında olman gerekiyor!');
    music.stop(message.guild.id);
    message.reply('⏹️ Müzik durduruldu ve kuyruk temizlendi.');
  },
};
