const { EmbedBuilder } = require('discord.js');
const music = require('../music/MusicPlayer');
module.exports = {
  name: 'queue', aliases: ['q', 'kuyruk', 'liste'],
  description: 'Müzik kuyruğunu gösterir.', usage: '!queue',
  async execute(message) {
    const data = music.getQueue(message.guild.id);
    if (!data?.current && !data?.queue?.length) return message.reply('❌ Kuyruk boş.');
    const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
    const loopLabel = { none: '➡️ Kapalı', song: '🔂 Şarkı', queue: '🔁 Kuyruk' };
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`🎵 ${message.guild.name} — Kuyruk`)
      .setFooter({ text: `${data.queue.length + 1} şarkı • Loop: ${loopLabel[data.loopMode]}` });
    if (data.current) embed.addFields({ name: '▶️ Şu An', value: `**[${data.current.title}](${data.current.url})** \`${fmt(data.current.duration)}\`` });
    if (data.queue.length) {
      embed.addFields({ name: `📋 Sıradakiler (${data.queue.length})`, value: data.queue.slice(0,10).map((t,i)=>`\`${i+1}.\` [${t.title}](${t.url}) \`${fmt(t.duration)}\``).join('\n') });
      if (data.queue.length > 10) embed.addFields({ name: '\u200b', value: `...ve **${data.queue.length-10}** şarkı daha` });
    }
    message.reply({ embeds: [embed] });
  },
};
