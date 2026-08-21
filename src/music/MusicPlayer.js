const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
} = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');
const playdl = require('play-dl');

// ─────────────────────────────────────────────
// Her sunucu için ayrı kuyruk tutulur
// ─────────────────────────────────────────────
class MusicPlayer {
  constructor() {
    // guildId → { connection, player, queue, current, textChannel, loopMode }
    this.queues = new Map();
  }

  // ── Yardımcı: Sunucu verisini al veya oluştur ──
  getQueue(guildId) {
    if (!this.queues.has(guildId)) {
      this.queues.set(guildId, {
        connection: null,
        player: null,
        queue: [],
        current: null,
        textChannel: null,
        loopMode: 'none', // 'none' | 'song' | 'queue'
      });
    }
    return this.queues.get(guildId);
  }

  // ── Ses kanalına bağlan ──
  async connect(voiceChannel, guildId) {
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
    } catch {
      connection.destroy();
      throw new Error('Ses kanalına bağlanılamadı.');
    }

    return connection;
  }

  // ── YouTube URL veya arama ile şarkı bilgisi getir ──
  async resolve(query) {
    let info;

    if (ytdl.validateURL(query)) {
      // Direkt YouTube URL'si
      const raw = await ytdl.getInfo(query);
      info = {
        title: raw.videoDetails.title,
        url: raw.videoDetails.video_url,
        duration: parseInt(raw.videoDetails.lengthSeconds),
        thumbnail: raw.videoDetails.thumbnails.slice(-1)[0]?.url || null,
        requestedBy: null,
      };
    } else {
      // Arama yap
      const results = await playdl.search(query, { source: { youtube: 'video' }, limit: 1 });
      if (!results || results.length === 0) throw new Error('Şarkı bulunamadı.');
      const video = results[0];
      info = {
        title: video.title,
        url: video.url,
        duration: video.durationInSec,
        thumbnail: video.thumbnails?.[0]?.url || null,
        requestedBy: null,
      };
    }

    return info;
  }

  // ── Şarkıyı kuyruğa ekle ve gerekirse çalmaya başla ──
  async play(guildId, voiceChannel, textChannel, query) {
    const data = this.getQueue(guildId);
    data.textChannel = textChannel;

    const song = await this.resolve(query);
    song.requestedBy = null; // çağıran komut set edecek

    data.queue.push(song);

    // Bağlantı yoksa bağlan
    if (!data.connection) {
      data.connection = await this.connect(voiceChannel, guildId);

      data.connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(data.connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(data.connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
        } catch {
          this._cleanup(guildId);
        }
      });

      this._playNext(guildId);
    }

    return song;
  }

  // ── Sıradaki şarkıyı çal ──
  async _playNext(guildId) {
    const data = this.queues.get(guildId);
    if (!data) return;

    if (data.queue.length === 0) {
      data.current = null;
      if (data.textChannel) {
        data.textChannel.send('✅ Kuyruk bitti, ses kanalından ayrılıyorum.').catch(() => {});
      }
      setTimeout(() => this._cleanup(guildId), 5000);
      return;
    }

    const song = data.queue.shift();
    data.current = song;

    try {
      // play-dl ile stream al (ytdl-core'dan daha kararlı)
      const stream = await playdl.stream(song.url, { quality: 2 });
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
        inlineVolume: true,
      });
      resource.volume?.setVolume(0.5);

      if (!data.player) {
        data.player = createAudioPlayer();
        data.connection.subscribe(data.player);

        data.player.on(AudioPlayerStatus.Idle, () => {
          if (data.loopMode === 'song' && data.current) {
            // Aynı şarkıyı başa ekle
            data.queue.unshift(data.current);
          } else if (data.loopMode === 'queue' && data.current) {
            // Şarkıyı kuyruğun sonuna ekle
            data.queue.push(data.current);
          }
          this._playNext(guildId);
        });

        data.player.on('error', (err) => {
          console.error(`[MusicPlayer] Player hatası: ${err.message}`);
          this._playNext(guildId);
        });
      }

      data.player.play(resource);

      if (data.textChannel) {
        const embed = this._nowPlayingEmbed(song);
        data.textChannel.send({ embeds: [embed] }).catch(() => {});
      }
    } catch (err) {
      console.error(`[MusicPlayer] Çalma hatası: ${err.message}`);
      if (data.textChannel) {
        data.textChannel.send(`❌ Şarkı çalınırken hata: \`${err.message}\``).catch(() => {});
      }
      this._playNext(guildId);
    }
  }

  // ── Atla ──
  skip(guildId) {
    const data = this.queues.get(guildId);
    if (!data?.player) return false;
    data.player.stop(); // Idle event → _playNext tetiklenir
    return true;
  }

  // ── Durdur ve temizle ──
  stop(guildId) {
    const data = this.queues.get(guildId);
    if (!data) return false;
    data.queue = [];
    data.loopMode = 'none';
    if (data.player) data.player.stop();
    this._cleanup(guildId);
    return true;
  }

  // ── Duraklat ──
  pause(guildId) {
    const data = this.queues.get(guildId);
    if (!data?.player) return false;
    return data.player.pause();
  }

  // ── Devam ettir ──
  resume(guildId) {
    const data = this.queues.get(guildId);
    if (!data?.player) return false;
    return data.player.unpause();
  }

  // ── Ses seviyesi ──
  setVolume(guildId, volume) {
    const data = this.queues.get(guildId);
    if (!data?.player) return false;
    // player'ın aktif resource'una eriş
    const state = data.player.state;
    if (state?.resource?.volume) {
      state.resource.volume.setVolume(volume / 100);
      return true;
    }
    return false;
  }

  // ── Loop modu ──
  setLoop(guildId, mode) {
    const data = this.queues.get(guildId);
    if (!data) return false;
    data.loopMode = mode;
    return true;
  }

  // ── Kuyruk bilgisi ──
  getQueueList(guildId) {
    return this.queues.get(guildId) || null;
  }

  // ── Temizlik ──
  _cleanup(guildId) {
    const data = this.queues.get(guildId);
    if (!data) return;
    try { data.connection?.destroy(); } catch {}
    this.queues.delete(guildId);
  }

  // ── Now Playing embed ──
  _nowPlayingEmbed(song) {
    const { EmbedBuilder } = require('discord.js');
    const minutes = Math.floor(song.duration / 60);
    const seconds = String(song.duration % 60).padStart(2, '0');

    return new EmbedBuilder()
      .setColor('#1DB954')
      .setTitle('🎵 Şu An Çalıyor')
      .setDescription(`**[${song.title}](${song.url})**`)
      .addFields(
        { name: '⏱️ Süre', value: `${minutes}:${seconds}`, inline: true },
        { name: '🙋 İsteyen', value: song.requestedBy || 'Bilinmiyor', inline: true },
      )
      .setThumbnail(song.thumbnail || null)
      .setFooter({ text: '!queue • !skip • !stop • !pause • !resume' });
  }
}

module.exports = new MusicPlayer();
