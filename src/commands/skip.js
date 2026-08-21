const music = require('../music/MusicPlayer');
module.exports = {
  name: 'skip', aliases: ['s', 'geç'],
  description: 'Çalan şarkıyı atlar.', usage: '!skip',
  async execute(message) {
    const data = music.getQueue(message.guild.id);
    if (!data?.current) return message.reply('❌ Şu an çalan bir şarkı yok.');
    if (!message.member?.voice?.channel) return message.reply('❌ Ses kanalında olman gerekiyor!');
    const title = data.current.title;
    music.skip(message.guild.id);
    message.reply(`⏭️ **${title}** atlandı.`);
  },
};
