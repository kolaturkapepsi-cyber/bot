const { EmbedBuilder } = require('discord.js');
const { getDistube } = require('../music/MusicPlayer');

module.exports = {
  name: 'nowplaying',
  aliases: ['np', 'şuançalıyor'],
  description: 'Şu an çalan şarkıyı gösterir.',
  usage: '!nowplaying',

  async execute(message) {
    const distube = getDistube();
    const queue = distube.getQueue(message.guild.id);

    if (!queue || !queue.songs[0]) return message.reply('❌ Şu an çalan bir şarkı yok.');

    const song = queue.songs[0];
    const minutes = Math.floor(song.duration / 60);
    const seconds = String(song.duration % 60).padStart(2, '0');
    const loopLabels = { 0: '➡️ Kapalı', 1: '🔂 Şarkı', 2: '🔁 Kuyruk' };

    const embed = new EmbedBuilder()
      .setColor('#1DB954')
      .setTitle('🎵 Şu An Çalıyor')
      .setDescription(`**[${song.name}](${song.url})**`)
      .addFields(
        { name: '⏱️ Süre', value: `${minutes}:${seconds}`, inline: true },
        { name: '🙋 İsteyen', value: song.user?.username || 'Bilinmiyor', inline: true },
        { name: '🔁 Loop', value: loopLabels[queue.repeatMode] || '➡️ Kapalı', inline: true },
        { name: '📋 Kuyrukta', value: `${queue.songs.length} şarkı`, inline: true },
      )
      .setThumbnail(song.thumbnail || null);

    message.reply({ embeds: [embed] });
  },
};
