const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
} = require('@discordjs/voice');
const { Innertube } = require('youtubei.js');
const { Readable } = require('stream');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');

// ffmpeg-static PATH'e ekle
const ffmpegDir = path.dirname(ffmpegPath);
if (process.env.PATH && !process.env.PATH.includes(ffmpegDir)) {
  process.env.PATH = ffmpegDir + path.delimiter + process.env.PATH;
}

// Innertube instance (singleton)
let _yt = null;
async function getYT() {
  if (!_yt) {
    _yt = await Innertube.create({ generate_session_locally: true });
  }
  return _yt;
}

// ── Kuyruk Map ──
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

// Video ID'yi URL'den çıkar
function extractVideoId(query) {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = query.match(p);
    if (m) return m[1];
  }
  return null;
}

async function resolveTrack(query) {
  const yt = await getYT();
  let videoId = extractVideoId(query);

  if (!videoId) {
    // Arama yap
    const results = await yt.search(query, { type: 'video' });
    const video = results.videos?.[0];
    if (!video) throw new Error('Şarkı bulunamadı.');
    videoId = video.id;
  }

  const info = await yt.getBasicInfo(videoId);
  const basic = info.basic_info;

  return {
    videoId,
    title: basic.title || 'Bilinmeyen',
    url: `https://www.youtube.com/watch?v=${videoId}`,
    duration: basic.duration || 0,
    thumbnail: basic.thumbnail?.[0]?.url || null,
    requestedBy: null,
  };
}

async function getAudioStream(videoId) {
  const yt = await getYT();
  const info = await yt.getInfo(videoId);

  // ReadableStream → Node.js Readable'a çevir
  const webStream = await info.download({
    type: 'audio',
    quality: 'best',
    format: 'any',
  });

  return Readable.fromWeb(webStream);
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
    const audioStream = await getAudioStream(song.videoId);

    const resource = createAudioResource(audioStream, {
      inlineVolume: true,
    });
    resource.volume?.setVolume(data.volume);

    data.player.play(resource);

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
