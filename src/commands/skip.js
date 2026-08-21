const { useQueue } = require('discord-player');

module.exports = {
  name: 'skip',
  aliases: ['s', 'geç'],
  description: 'Çalan şarkıyı atlayıp kuyruktaki sonraki şarkıya geçer.',
  usage: '!skip',

  async execute(message) {
    const queue = useQueue(message.guild.id);
    if (!queue?.isPlaying()) return message.reply('❌ Şu an çalan bir şarkı yok.');
    if (!message.member?.voice?.channel) return message.reply('❌ Bir ses kanalında olman gerekiyor!');

    const track = queue.currentTrack;
    queue.node.skip();
    message.reply(`⏭️ **${track?.title}** atlandı.`);
  },
};
