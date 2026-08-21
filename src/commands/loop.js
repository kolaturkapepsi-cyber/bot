const { getDistube } = require('../music/MusicPlayer');

module.exports = {
  name: 'loop',
  aliases: ['döngü', 'tekrar'],
  description: 'Döngü modunu ayarlar: none (kapalı), song (şarkı), queue (kuyruk).',
  usage: '!loop <none|song|queue>',

  async execute(message, args) {
    const distube = getDistube();
    const queue = distube.getQueue(message.guild.id);

    if (!queue) return message.reply('❌ Şu an çalan bir şarkı yok.');
    if (!message.member?.voice?.channel) return message.reply('❌ Bir ses kanalında olman gerekiyor!');

    const modeMap = { none: 0, song: 1, queue: 2 };
    const mode = args[0]?.toLowerCase();

    if (!mode || !(mode in modeMap)) {
      return message.reply('❌ Geçerli mod: `none`, `song`, `queue`\nÖrnek: `!loop song`');
    }

    try {
      distube.setRepeatMode(message.guild.id, modeMap[mode]);
      const labels = { none: '➡️ Döngü kapatıldı', song: '🔂 Şarkı döngüsü açıldı', queue: '🔁 Kuyruk döngüsü açıldı' };
      message.reply(labels[mode]);
    } catch (err) {
      message.reply(`❌ ${err.message}`);
    }
  },
};
