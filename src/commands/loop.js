const musicPlayer = require('../music/MusicPlayer');

module.exports = {
  name: 'loop',
  aliases: ['döngü', 'tekrar'],
  description: 'Döngü modunu ayarlar: none (kapalı), song (şarkı), queue (kuyruk).',
  usage: '!loop <none|song|queue>',

  async execute(message, args) {
    const data = musicPlayer.getQueueList(message.guild.id);

    if (!data || !data.current) {
      return message.reply('❌ Şu an çalan bir şarkı yok.');
    }

    if (!message.member?.voice?.channel) {
      return message.reply('❌ Bir ses kanalında olman gerekiyor!');
    }

    const validModes = ['none', 'song', 'queue'];
    const mode = args[0]?.toLowerCase();

    if (!mode || !validModes.includes(mode)) {
      return message.reply('❌ Geçerli mod: `none`, `song`, `queue`\nÖrnek: `!loop song`');
    }

    musicPlayer.setLoop(message.guild.id, mode);

    const labels = { none: '➡️ Döngü kapatıldı', song: '🔂 Şarkı döngüsü açıldı', queue: '🔁 Kuyruk döngüsü açıldı' };
    message.reply(labels[mode]);
  },
};
