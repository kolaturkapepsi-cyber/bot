const music = require('../music/MusicPlayer');
module.exports = {
  name: 'volume', aliases: ['vol', 'ses'],
  description: 'Ses seviyesini ayarlar (1-100).', usage: '!volume <1-100>',
  async execute(message, args) {
    const data = music.getQueue(message.guild.id);
    if (!data?.current) return message.reply('❌ Şu an çalan bir şarkı yok.');
    if (!args[0]) return message.reply(`🔊 Mevcut ses: **%${Math.round(data.volume*100)}**`);
    const vol = parseInt(args[0]);
    if (isNaN(vol) || vol < 1 || vol > 100) return message.reply('❌ 1-100 arasında bir değer gir.');
    music.setVolume(message.guild.id, vol);
    message.reply(`🔊 Ses **%${vol}** olarak ayarlandı.`);
  },
};
