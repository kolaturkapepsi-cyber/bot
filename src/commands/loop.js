const music = require('../music/MusicPlayer');
module.exports = {
  name: 'loop', aliases: ['döngü'],
  description: 'Döngü modunu ayarlar.', usage: '!loop <none|song|queue>',
  async execute(message, args) {
    const data = music.getQueue(message.guild.id);
    if (!data) return message.reply('❌ Şu an çalan bir şarkı yok.');
    const mode = args[0]?.toLowerCase();
    if (!['none','song','queue'].includes(mode)) return message.reply('❌ Geçerli: `none`, `song`, `queue`');
    music.setLoop(message.guild.id, mode);
    const labels = { none:'➡️ Döngü kapalı', song:'🔂 Şarkı döngüsü', queue:'🔁 Kuyruk döngüsü' };
    message.reply(labels[mode]);
  },
};
