const { getDistube } = require('../music/MusicPlayer');

module.exports = {
  name: 'left',
  aliases: ['leave', 'ayrıl', 'çık'],
  description: 'Botu ses kanalından çıkarır ve kuyruğu temizler.',
  usage: '!left',

  async execute(message) {
    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) {
      return message.reply('❌ Bir ses kanalında olman gerekiyor!');
    }

    const distube = getDistube();
    const queue = distube.getQueue(message.guild.id);
    const voice = distube.voices.get(message.guild.id);

    if (!queue && !voice) {
      return message.reply('❌ Bot zaten bir ses kanalında değil.');
    }

    try {
      if (queue) {
        // Müzik çalıyorsa kuyruğu temizleyerek çık
        await distube.stop(message.guild.id);
      } else {
        // Sadece bağlıysa direkt ayrıl
        voice.leave();
      }
      message.reply(`👋 **${voiceChannel.name}** kanalından ayrıldım.`);
    } catch (err) {
      console.error('[left komutu]', err.message);
      message.reply(`❌ Ayrılırken hata: \`${err.message}\``);
    }
  },
};
