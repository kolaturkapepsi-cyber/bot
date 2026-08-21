const musicPlayer = require('../music/MusicPlayer');

module.exports = {
  name: 'skip',
  aliases: ['s', 'geç'],
  description: 'Çalan şarkıyı atlayıp kuyruktaki sonraki şarkıya geçer.',
  usage: '!skip',

  async execute(message) {
    const data = musicPlayer.getQueueList(message.guild.id);

    if (!data || !data.current) {
      return message.reply('❌ Şu an çalan bir şarkı yok.');
    }

    if (!message.member?.voice?.channel) {
      return message.reply('❌ Bir ses kanalında olman gerekiyor!');
    }

    const skipped = musicPlayer.skip(message.guild.id);
    if (skipped) {
      message.reply(`⏭️ **${data.current.title}** atlandı.`);
    } else {
      message.reply('❌ Şarkı atlanamadı.');
    }
  },
};
