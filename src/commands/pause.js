const { useQueue } = require('discord-player');

module.exports = {
  name: 'pause',
  aliases: ['duraklat'],
  description: 'Çalan şarkıyı duraklatır.',
  usage: '!pause',

  async execute(message) {
    const queue = useQueue(message.guild.id);
    if (!queue?.isPlaying()) return message.reply('❌ Şu an çalan bir şarkı yok.');
    if (!message.member?.voice?.channel) return message.reply('❌ Bir ses kanalında olman gerekiyor!');
    if (queue.node.isPaused()) return message.reply('❌ Şarkı zaten duraklatılmış.');

    queue.node.pause();
    message.reply('⏸️ Şarkı duraklatıldı. Devam için `!resume` kullan.');
  },
};
