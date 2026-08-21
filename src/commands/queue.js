const { EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
  name: 'queue',
  aliases: ['q', 'kuyruk', 'liste'],
  description: 'Müzik kuyruğunu gösterir.',
  usage: '!queue',

  async execute(message) {
    const queue = useQueue(message.guild.id);
    if (!queue?.currentTrack) return message.reply('❌ Kuyruk boş.');

    const tracks = queue.tracks.toArray();
    const current = queue.currentTrack;

    const repeatLabels = { 0: '➡️ Kapalı', 1: '🔂 Şarkı', 2: '🔁 Kuyruk', 3: '🔀 Karışık' };

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`🎵 ${message.guild.name} — Müzik Kuyruğu`)
      .addFields({
        name: '▶️ Şu An Çalıyor',
        value: `**[${current.title}](${current.url})** \`${current.duration}\``,
      })
      .setFooter({ text: `Toplam ${tracks.length + 1} şarkı • Loop: ${repeatLabels[queue.repeatMode] || '➡️ Kapalı'}` });

    if (tracks.length > 0) {
      const list = tracks.slice(0, 10)
        .map((t, i) => `\`${i + 1}.\` [${t.title}](${t.url}) \`${t.duration}\``)
        .join('\n');

      embed.addFields({ name: `📋 Sıradakiler (${tracks.length})`, value: list });

      if (tracks.length > 10) {
        embed.addFields({ name: '\u200b', value: `... ve **${tracks.length - 10}** şarkı daha.` });
      }
    }

    message.reply({ embeds: [embed] });
  },
};
