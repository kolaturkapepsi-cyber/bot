const { useQueue } = require('discord-player');

module.exports = {
  name: 'resume',
  aliases: ['devam', 'r'],
  description: 'Duraklatılmış şarkıyı devam ettirir.',
  usage: '!resume',

  async execute(message) {
    const queue = useQueue(message.guild.id);
    if (!queue) return message.reply('❌ Şu an çalan bir şarkı yok.');
    if (!message.member?.voice?.channel) return message.reply('❌ Bir ses kanalında olman gerekiyor!');
    if (!queue.node.isPaused()) return message.reply('❌ Şarkı zaten çalıyor.');

    queue.node.resume();
    message.reply('▶️ Şarkı devam ediyor.');
  },
};
