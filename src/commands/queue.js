const { EmbedBuilder } = require('discord.js');
const { getDistube } = require('../music/MusicPlayer');

module.exports = {
  name: 'queue',
  aliases: ['q', 'kuyruk', 'liste'],
  description: 'Müzik kuyruğunu gösterir.',
  usage: '!queue',

  async execute(message) {
    const distube = getDistube();
    const queue = distube.getQueue(message.guild.id);

    if (!queue || queue.songs.length === 0) {
      return message.reply('❌ Kuyruk boş. Şarkı eklemek için `!play <şarkı>` kullan.');
    }

    const formatDuration = (sec) => {
      const m = Math.floor(sec / 60);
      const s = String(sec % 60).padStart(2, '0');
      return `${m}:${s}`;
    };

    const loopLabels = { 0: '➡️ Kapalı', 1: '🔂 Şarkı', 2: '🔁 Kuyruk' };

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`🎵 ${message.guild.name} — Müzik Kuyruğu`)
      .setFooter({
        text: `Toplam ${queue.songs.length} şarkı • Loop: ${loopLabels[queue.repeatMode] || '➡️ Kapalı'}`,
      });

    // Şu an çalıyor
    const current = queue.songs[0];
    embed.addFields({
      name: '▶️ Şu An Çalıyor',
      value: `**[${current.name}](${current.url})** \`${formatDuration(current.duration)}\``,
    });

    // Sıradakiler
    if (queue.songs.length > 1) {
      const list = queue.songs
        .slice(1, 11)
        .map((song, i) => `\`${i + 1}.\` [${song.name}](${song.url}) \`${formatDuration(song.duration)}\``)
        .join('\n');

      embed.addFields({
        name: `📋 Sıradakiler (${queue.songs.length - 1} şarkı)`,
        value: list,
      });

      if (queue.songs.length > 11) {
        embed.addFields({ name: '\u200b', value: `... ve **${queue.songs.length - 11}** şarkı daha.` });
      }
    }

    message.reply({ embeds: [embed] });
  },
};
