const { useQueue } = require('discord-player');
const { QueueRepeatMode } = require('discord-player');

module.exports = {
  name: 'loop',
  aliases: ['döngü', 'tekrar'],
  description: 'Döngü modunu ayarlar: none, song, queue.',
  usage: '!loop <none|song|queue>',

  async execute(message, args) {
    const queue = useQueue(message.guild.id);
    if (!queue) return message.reply('❌ Şu an çalan bir şarkı yok.');
    if (!message.member?.voice?.channel) return message.reply('❌ Bir ses kanalında olman gerekiyor!');

    const modeMap = {
      none: QueueRepeatMode.OFF,
      song: QueueRepeatMode.TRACK,
      queue: QueueRepeatMode.QUEUE,
    };

    const mode = args[0]?.toLowerCase();
    if (!mode || !(mode in modeMap)) {
      return message.reply('❌ Geçerli mod: `none`, `song`, `queue`');
    }

    queue.setRepeatMode(modeMap[mode]);
    const labels = { none: '➡️ Döngü kapatıldı', song: '🔂 Şarkı döngüsü', queue: '🔁 Kuyruk döngüsü' };
    message.reply(labels[mode]);
  },
};
