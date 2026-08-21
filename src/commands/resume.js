const musicPlayer = require('../music/MusicPlayer');

module.exports = {
  name: 'resume',
  aliases: ['devam', 'r'],
  description: 'Duraklatılmış şarkıyı devam ettirir.',
  usage: '!resume',

  async execute(message) {
    const data = musicPlayer.getQueueList(message.guild.id);

    if (!data || !data.current) {
      return message.reply('❌ Şu an çalan bir şarkı yok.');
    }

    if (!message.member?.voice?.channel) {
      return message.reply('❌ Bir ses kanalında olman gerekiyor!');
    }

    const resumed = musicPlayer.resume(message.guild.id);
    if (resumed) {
      message.reply('▶️ Şarkı devam ediyor.');
    } else {
      message.reply('❌ Şarkı zaten çalıyor veya devam ettirilemedi.');
    }
  },
};
