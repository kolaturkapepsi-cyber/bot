const { EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
  name: 'nowplaying',
  aliases: ['np', 'şuançalıyor'],
  description: 'Şu an çalan şarkıyı gösterir.',
  usage: '!nowplaying',

  async execute(message) {
    const queue = useQueue(message.guild.id);
    if (!queue?.currentTrack) return message.reply('❌ Şu an çalan bir şarkı yok.');

    const track = queue.currentTrack;
    const repeatLabels = { 0: '➡️ Kapalı', 1: '🔂 Şarkı', 2: '🔁 Kuyruk' };

    const embed = new EmbedBuilder()
      .setColor('#1DB954')
      .setTitle('🎵 Şu An Çalıyor')
      .setDescription(`**[${track.title}](${track.url})**`)
      .addFields(
        { name: '⏱️ Süre', value: track.duration, inline: true },
        { name: '🙋 İsteyen', value: track.requestedBy?.username || 'Bilinmiyor', inline: true },
        { name: '🔁 Loop', value: repeatLabels[queue.repeatMode] || '➡️ Kapalı', inline: true },
        { name: '📋 Kuyrukta', value: `${queue.tracks.size} şarkı`, inline: true },
      )
      .setThumbnail(track.thumbnail || null);

    message.reply({ embeds: [embed] });
  },
};
