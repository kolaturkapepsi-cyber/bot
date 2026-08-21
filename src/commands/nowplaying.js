const { EmbedBuilder } = require('discord.js');
const music = require('../music/MusicPlayer');
module.exports = {
  name: 'nowplaying', aliases: ['np'],
  description: 'Şu an çalan şarkıyı gösterir.', usage: '!np',
  async execute(message) {
    const data = music.getQueue(message.guild.id);
    if (!data?.current) return message.reply('❌ Şu an çalan bir şarkı yok.');
    const s = data.current;
    const m = Math.floor(s.duration/60), sec = String(s.duration%60).padStart(2,'0');
    const loopLabel = { none:'➡️ Kapalı', song:'🔂 Şarkı', queue:'🔁 Kuyruk' };
    const embed = new EmbedBuilder()
      .setColor('#1DB954').setTitle('🎵 Şu An Çalıyor')
      .setDescription(`**[${s.title}](${s.url})**`)
      .addFields(
        { name:'⏱️ Süre', value:`${m}:${sec}`, inline:true },
        { name:'🙋 İsteyen', value:s.requestedBy||'Bilinmiyor', inline:true },
        { name:'🔁 Loop', value:loopLabel[data.loopMode], inline:true },
        { name:'📋 Kuyruk', value:`${data.queue.length} şarkı`, inline:true },
      ).setThumbnail(s.thumbnail);
    message.reply({ embeds:[embed] });
  },
};
