const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');

// ffmpeg-static binary'sini sistem PATH'ine ekle
const ffmpegDir = path.dirname(ffmpegPath);
if (!process.env.PATH.includes(ffmpegDir)) {
  process.env.PATH = ffmpegDir + path.delimiter + process.env.PATH;
}

let _distube = null;

/**
 * DisTube örneğini başlatır. index.js'ten client hazır olunca çağrılır.
 */
function initDistube(client) {
  // yt-dlp: YouTube bot korumasını aşar, en güvenilir seçenek
  const plugins = [new YtDlpPlugin({ update: true })];

  _distube = new DisTube(client, {
    plugins,
    emitNewSongOnly: false,
    joinNewVoiceChannel: true,
    nsfw: false,
  });

  // ── Eventler ──
  _distube.on('playSong', (queue, song) => {
    const { EmbedBuilder } = require('discord.js');
    const minutes = Math.floor(song.duration / 60);
    const seconds = String(song.duration % 60).padStart(2, '0');

    const embed = new EmbedBuilder()
      .setColor('#1DB954')
      .setTitle('🎵 Şu An Çalıyor')
      .setDescription(`**[${song.name}](${song.url})**`)
      .addFields(
        { name: '⏱️ Süre', value: `${minutes}:${seconds}`, inline: true },
        { name: '🙋 İsteyen', value: song.user?.username || 'Bilinmiyor', inline: true },
      )
      .setThumbnail(song.thumbnail || null)
      .setFooter({ text: '!queue • !skip • !stop • !pause • !resume' });

    queue.textChannel?.send({ embeds: [embed] }).catch(() => {});
  });

  _distube.on('addSong', (queue, song) => {
    const { EmbedBuilder } = require('discord.js');
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('✅ Kuyruğa Eklendi')
      .setDescription(`**[${song.name}](${song.url})**`)
      .addFields(
        { name: '📋 Kuyruk Sırası', value: `#${queue.songs.length}`, inline: true },
        { name: '🙋 İsteyen', value: song.user?.username || 'Bilinmiyor', inline: true },
      )
      .setThumbnail(song.thumbnail || null);

    queue.textChannel?.send({ embeds: [embed] }).catch(() => {});
  });

  _distube.on('finish', (queue) => {
    queue.textChannel?.send('✅ Kuyruk bitti, ses kanalından ayrılıyorum.').catch(() => {});
  });

  _distube.on('error', (error, queue) => {
    console.error('[DisTube] Hata:', error.message);
    queue?.textChannel?.send(`❌ Hata: \`${error.message}\``).catch(() => {});
  });

  _distube.on('disconnect', (queue) => {
    queue?.textChannel?.send('👋 Ses kanalından ayrıldım.').catch(() => {});
  });

  return _distube;
}

function getDistube() {
  return _distube;
}

module.exports = { initDistube, getDistube };
