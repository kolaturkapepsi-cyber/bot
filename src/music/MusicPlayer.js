const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');

// ffmpeg-static binary'sini PATH'e ekle
const ffmpegDir = path.dirname(ffmpegPath);
if (!process.env.PATH.includes(ffmpegDir)) {
  process.env.PATH = ffmpegDir + path.delimiter + process.env.PATH;
}

let _player = null;

async function initPlayer(client) {
  _player = new Player(client, {
    skipFFmpeg: false,
  });

  // Tüm varsayılan extractor'ları yükle (YouTube dahil)
  await _player.extractors.loadMulti(DefaultExtractors);

  // ── Eventler ──
  _player.events.on('playerStart', (queue, track) => {
    const { EmbedBuilder } = require('discord.js');
    const minutes = Math.floor(track.durationMS / 60000);
    const seconds = String(Math.floor((track.durationMS % 60000) / 1000)).padStart(2, '0');

    const embed = new EmbedBuilder()
      .setColor('#1DB954')
      .setTitle('🎵 Şu An Çalıyor')
      .setDescription(`**[${track.title}](${track.url})**`)
      .addFields(
        { name: '⏱️ Süre', value: `${minutes}:${seconds}`, inline: true },
        { name: '🙋 İsteyen', value: track.requestedBy?.username || 'Bilinmiyor', inline: true },
      )
      .setThumbnail(track.thumbnail || null)
      .setFooter({ text: '!queue • !skip • !stop • !pause • !resume' });

    queue.metadata?.channel?.send({ embeds: [embed] }).catch(() => {});
  });

  _player.events.on('audioTrackAdd', (queue, track) => {
    // İlk şarkı eklendiğinde playerStart zaten tetiklenir
    if (queue.tracks.size > 0) {
      queue.metadata?.channel?.send(
        `✅ **${track.title}** kuyruğa eklendi. (Sıra: #${queue.tracks.size + 1})`
      ).catch(() => {});
    }
  });

  _player.events.on('emptyQueue', (queue) => {
    queue.metadata?.channel?.send('✅ Kuyruk bitti, ses kanalından ayrılıyorum.').catch(() => {});
  });

  _player.events.on('error', (queue, error) => {
    console.error(`[MusicPlayer] Hata: ${error.message}`);
    queue.metadata?.channel?.send(`❌ Hata: \`${error.message}\``).catch(() => {});
  });

  _player.events.on('playerError', (queue, error) => {
    console.error(`[MusicPlayer] Player hatası: ${error.message}`);
    queue.metadata?.channel?.send(`❌ Çalma hatası: \`${error.message}\``).catch(() => {});
  });

  console.log('🎵 MusicPlayer (discord-player) hazır.');
  return _player;
}

function getPlayer() {
  return _player;
}

module.exports = { initPlayer, getPlayer };
