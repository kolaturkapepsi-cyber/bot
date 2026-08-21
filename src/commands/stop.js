const { useQueue } = require('discord-player');

module.exports = {
  name: 'stop',
  aliases: ['dc'],
  description: 'Müziği durdurur, kuyruğu temizler ve ses kanalından ayrılır.',
  usage: '!stop',

  async execute(message) {
    const queue = useQueue(message.guild.id);
    if (!queue) return message.reply('❌ Şu an çalan bir şarkı yok.');
    if (!message.member?.voice?.channel) return message.reply('❌ Bir ses kanalında olman gerekiyor!');

    queue.delete();
    message.reply('⏹️ Müzik durduruldu ve kuyruk temizlendi.');
  },
};
