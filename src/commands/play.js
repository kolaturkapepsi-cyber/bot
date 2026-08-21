const { EmbedBuilder } = require('discord.js');
const musicPlayer = require('../music/MusicPlayer');

module.exports = {
  name: 'play',
  aliases: ['p', 'çal'],
  description: 'YouTube\'dan şarkı çalar. URL veya arama terimi kullanabilirsiniz.',
  usage: '!play <şarkı adı veya YouTube URL>',

  async execute(message, args) {
    // Argüman kontrolü
    if (!args.length) {
      return message.reply('❌ Bir şarkı adı veya YouTube URL\'si gir.\n**Kullanım:** `!play <şarkı adı veya URL>`');
    }

    // Ses kanalı kontrolü
    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) {
      return message.reply('❌ Bir ses kanalında olman gerekiyor!');
    }

    // Bot izin kontrolü
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return message.reply('❌ Bu ses kanalına bağlanmak veya konuşmak için iznim yok!');
    }

    const query = args.join(' ');

    // Yükleniyor mesajı
    const loadingMsg = await message.reply('🔎 Şarkı aranıyor...');

    try {
      const song = await musicPlayer.play(
        message.guild.id,
        voiceChannel,
        message.channel,
        query
      );

      // requestedBy bilgisini set et
      song.requestedBy = message.author.username;

      const data = musicPlayer.getQueueList(message.guild.id);
      const queueLength = data ? data.queue.length : 0;

      // Eğer kuyrukta başka şarkı varsa "eklendi" mesajı göster
      // (now playing embed zaten MusicPlayer tarafından gönderiliyor)
      if (queueLength > 0) {
        const embed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('✅ Kuyruğa Eklendi')
          .setDescription(`**[${song.title}](${song.url})**`)
          .addFields(
            { name: '📋 Kuyruk Sırası', value: `#${queueLength + 1}`, inline: true },
            { name: '🙋 İsteyen', value: message.author.username, inline: true },
          )
          .setThumbnail(song.thumbnail || null);

        await loadingMsg.edit({ content: '', embeds: [embed] });
      } else {
        await loadingMsg.delete().catch(() => {});
      }
    } catch (err) {
      console.error('[play komutu]', err.message);
      await loadingMsg.edit(`❌ Hata: \`${err.message}\``);
    }
  },
};
