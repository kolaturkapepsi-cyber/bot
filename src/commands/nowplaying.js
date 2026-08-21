const { EmbedBuilder } = require('discord.js');
const musicPlayer = require('../music/MusicPlayer');

module.exports = {
  name: 'nowplaying',
  aliases: ['np', 'şuançalıyor'],
  description: 'Şu an çalan şarkıyı gösterir.',
  usage: '!nowplaying',

  async execute(message) {
    const data = musicPlayer.getQueueList(message.guild.id);

    if (!data || !data.current) {
      return message.reply('❌ Şu an çalan bir şarkı yok.');
    }

    const song = data.current;
    const minutes = Math.floor(song.duration / 60);
    const seconds = String(song.duration % 60).padStart(2, '0');
    const loopEmoji = { none: '➡️ Kapalı', song: '🔂 Şarkı', queue: '🔁 Kuyruk' };

    const embed = new EmbedBuilder()
      .setColor('#1DB954')
      .setTitle('🎵 Şu An Çalıyor')
      .setDescription(`**[${song.title}](${song.url})**`)
      .addFields(
        { name: '⏱️ Süre', value: `${minutes}:${seconds}`, inline: true },
        { name: '🙋 İsteyen', value: song.requestedBy || 'Bilinmiyor', inline: true },
        { name: '🔁 Loop', value: loopEmoji[data.loopMode] || '➡️ Kapalı', inline: true },
        { name: '📋 Kuyrukta', value: `${data.queue.length} şarkı`, inline: true },
      )
      .setThumbnail(song.thumbnail || null);

    message.reply({ embeds: [embed] });
  },
};
