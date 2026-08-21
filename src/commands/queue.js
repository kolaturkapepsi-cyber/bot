const { EmbedBuilder } = require('discord.js');
const musicPlayer = require('../music/MusicPlayer');

module.exports = {
  name: 'queue',
  aliases: ['q', 'kuyruk', 'liste'],
  description: 'Müzik kuyruğunu gösterir.',
  usage: '!queue',

  async execute(message) {
    const data = musicPlayer.getQueueList(message.guild.id);

    if (!data || (!data.current && data.queue.length === 0)) {
      return message.reply('❌ Kuyruk boş. Şarkı eklemek için `!play <şarkı>` kullan.');
    }

    const formatDuration = (sec) => {
      const m = Math.floor(sec / 60);
      const s = String(sec % 60).padStart(2, '0');
      return `${m}:${s}`;
    };

    const loopEmoji = { none: '➡️ Kapalı', song: '🔂 Şarkı', queue: '🔁 Kuyruk' };

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`🎵 ${message.guild.name} — Müzik Kuyruğu`)
      .setFooter({
        text: `Toplam ${data.queue.length + (data.current ? 1 : 0)} şarkı • Loop: ${loopEmoji[data.loopMode] || '➡️ Kapalı'}`,
      });

    // Şu an çalıyor
    if (data.current) {
      embed.addFields({
        name: '▶️ Şu An Çalıyor',
        value: `**[${data.current.title}](${data.current.url})** \`${formatDuration(data.current.duration)}\``,
      });
    }

    // Kuyruk listesi (max 10 şarkı göster)
    if (data.queue.length > 0) {
      const list = data.queue
        .slice(0, 10)
        .map((song, i) => `\`${i + 1}.\` [${song.title}](${song.url}) \`${formatDuration(song.duration)}\``)
        .join('\n');

      embed.addFields({
        name: `📋 Sıradakiler (${data.queue.length} şarkı)`,
        value: list,
      });

      if (data.queue.length > 10) {
        embed.addFields({
          name: '\u200b',
          value: `... ve **${data.queue.length - 10}** şarkı daha.`,
        });
      }
    }

    message.reply({ embeds: [embed] });
  },
};
