const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
  StreamType,
} = require('@discordjs/voice');
const playdl = require('play-dl');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');

// ffmpeg-static PATH'e ekle
const ffmpegDir = path.dirname(ffmpegPath);
if (process.env.PATH && !process.env.PATH.includes(ffmpegDir)) {
  process.env.PATH = ffmpegDir + path.delimiter + process.env.PATH;
}

// guildId → { connection, player, queue, current, textChannel, loopMode, volume }
const queues = new Map();

function getQueue(guildId) {
  if (!queues.has(guildId)) {
    queues.set(guildId, {
      connection: null,
      player: null,
      queue: [],
      current: null,
      textChannel: null,
      loopMode: 'none',
      volume: 0.5,
    });
  }
  return queues.get(guildId);
}

async function connectToChannel(voiceChannel) {
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: true,
  });
  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
  } catch {
    connection.destroy();
    throw new Error('Ses kanalına bağlanılamadı.');
  }
  return connection;
}

async function resolveTrack(query) {
  // URL mi?
  if (/^https?:\/\//.test(query)) {
    const info = await playdl.video_info(query);
    const d = info.video_details;
    return {
      title: d.title,
      url: d.url,
      duration: d.durationInSec,
      thumbnail: d.thumbnails?.[0]?.url || null,
      requestedBy: null,
    };
  }
  // Arama
  const results = await playdl.search(query, { source: { youtube: 'video' }, limit: 1 });
  if (!results?.length) throw new Error('Şarkı bulunamadı.');
  const v = results[0];
  return {
    title: v.title,
    url: v.url,
    duration: v.durationInSec,
    thumbnail: v.thumbnails?.[0]?.url || null,
    requestedBy: null,
  };
}

async function playNext(guildId) {
  const data = queues.get(guildId);
  if (!data) return;

  if (!data.queue.length) {
    data.current = null;
    data.textChannel?.send('✅ Kuyruk bitti, ses kanalından ayrılıyorum.').catch(() => {});
    setTimeout(() => cleanup(guildId), 5000);
    return;
  }

  const song = data.queue.shift();
  data.current = song;

  try {
    const stream = await playdl.stream(song.url, {
      quality: 2,
      precache: 3,
    });

    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
      inlineVolume: true,
    });
    resource.volume?.setVolume(data.volume);

    data.player.play(resource);

    // Now playing embed
    const { EmbedBuilder } = require('discord.js');
    const m = Math.floor(song.duration / 60);
    const s = String(song.duration % 60).padStart(2, '0');
    const embed = new EmbedBuilder()
      .setColor('#1DB954')
      .setTitle('🎵 Şu An Çalıyor')
      .setDescription(`**[${song.title}](${song.url})**`)
      .addFields(
        { name: '⏱️ Süre', value: `${m}:${s}`, inline: true },
        { name: '🙋 İsteyen', value: song.requestedBy || 'Bilinmiyor', inline: true },
      )
      .setThumbnail(song.thumbnail)
      .setFooter({ text: '!skip • !stop • !pause • !resume • !queue' });
    data.textChannel?.send({ embeds: [embed] }).catch(() => {});

  } catch (err) {
    console.error('[MusicPlayer] playNext hata:', err.message);
    data.textChannel?.send(`❌ \`${err.message}\``).catch(() => {});
    playNext(guildId);
  }
}

function cleanup(guildId) {
  const data = queues.get(guildId);
  if (!data) return;
  try { data.connection?.destroy(); } catch {}
  queues.delete(guildId);
}

// ── Ana play fonksiyonu ──
async function play(guildId, voiceChannel, textChannel, query) {
  const data = getQueue(guildId);
  data.textChannel = textChannel;

  const song = await resolveTrack(query);

  data.queue.push(song);
  const isFirst = !data.connection;

  if (isFirst) {
    data.connection = await connectToChannel(voiceChannel);

    data.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(data.connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(data.connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch { cleanup(guildId); }
    });

    data.player = createAudioPlayer();
    data.connection.subscribe(data.player);

    data.player.on(AudioPlayerStatus.Idle, () => {
      const d = queues.get(guildId);
      if (!d) return;
      if (d.loopMode === 'song' && d.current) d.queue.unshift(d.current);
      else if (d.loopMode === 'queue' && d.current) d.queue.push(d.current);
      playNext(guildId);
    });

    data.player.on('error', err => {
      console.error('[MusicPlayer] player error:', err.message);
      playNext(guildId);
    });

    playNext(guildId);
  }

  return { song, isFirst };
}

module.exports = {
  play,
  skip(guildId) {
    const d = queues.get(guildId);
    if (!d?.player) return false;
    d.player.stop();
    return true;
  },
  stop(guildId) {
    const d = queues.get(guildId);
    if (!d) return false;
    d.queue = [];
    d.loopMode = 'none';
    d.player?.stop();
    cleanup(guildId);
    return true;
  },
  pause(guildId) {
    return queues.get(guildId)?.player?.pause() || false;
  },
  resume(guildId) {
    return queues.get(guildId)?.player?.unpause() || false;
  },
  setVolume(guildId, vol) {
    const d = queues.get(guildId);
    if (!d) return false;
    d.volume = vol / 100;
    const state = d.player?.state;
    if (state?.resource?.volume) {
      state.resource.volume.setVolume(d.volume);
      return true;
    }
    return false;
  },
  setLoop(guildId, mode) {
    const d = queues.get(guildId);
    if (!d) return false;
    d.loopMode = mode;
    return true;
  },
  getQueue(guildId) {
    return queues.get(guildId) || null;
  },
  cleanup,
  getVoiceConnection,
};
