const musicPlayer = require('../music/MusicPlayer');

module.exports = {
  name: 'volume',
  aliases: ['vol', 'ses'],
  description: 'Ses seviyesini ayarlar (1-100).',
  usage: '!volume <1-100>',

  async execute(message, args) {
    const data = musicPlayer.getQueueList(message.guild.id);

    if (!data || !data.current) {
      return message.reply('❌ Şu an çalan bir şarkı yok.');
    }

    if (!message.member?.voice?.channel) {
      return message.reply('❌ Bir ses kanalında olman gerekiyor!');
    }

    if (!args[0]) {
      return message.reply('❌ Bir ses seviyesi belirt. Örnek: `!volume 50`');
    }

    const vol = parseInt(args[0]);
    if (isNaN(vol) || vol < 1 || vol > 100) {
      return message.reply('❌ Ses seviyesi 1 ile 100 arasında olmalı.');
    }

    const set = musicPlayer.setVolume(message.guild.id, vol);
    if (set) {
      message.reply(`🔊 Ses seviyesi **%${vol}** olarak ayarlandı.`);
    } else {
      message.reply('❌ Ses seviyesi ayarlanamadı.');
    }
  },
};
