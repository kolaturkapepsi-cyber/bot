const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'help',
  description: 'Tüm komutları listele',
  usage: '!help',

  async execute(message) {
    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('🛡️ AntiRaid Bot - Komut Listesi')
      .setThumbnail(message.client.user.displayAvatarURL())
      .addFields(
        {
          name: '🔨 Moderasyon Komutları',
          value: [
            '`!ban @kullanıcı [sebep]` — Kullanıcıyı banla (`!yasakla`)',
            '`!unban <ID> [sebep]` — Banı kaldır',
            '`!kick @kullanıcı [sebep]` — Kullanıcıyı at (`!at`)',
            '`!mute @kullanıcı <süre> [sebep]` — Timeout uygula (`!sustur`)\n↳ Süre: `10s` `5m` `1h` `1d`',
            '`!unmute @kullanıcı` — Timeout\'u kaldır (`!unsustur`)',
          ].join('\n'),
          inline: false
        },
        {
          name: '🛡️ AntiRaid Komutları',
          value: [
            '`!antiraid status` — Sistem durumunu göster',
            '`!antiraid on/off` — Sistemi aç/kapat',
            '`!antiraid set <seçenek> <değer>` — Eşik ayarla',
            '`!antiraid action <ban|kick|mute>` — Ceza türü ayarla',
            '`!antiraid whitelist add/remove @kullanıcı` — Whitelist yönet',
            '`!antiraid logchannel #kanal` — Log kanalı ayarla',
          ].join('\n'),
          inline: false
        },
        {
          name: '🔒 Lockdown Komutları',
          value: [
            '`!lockdown` — Lockdown durumunu göster',
            '`!lockdown on` — Sunucuyu kilitle',
            '`!lockdown off` — Kilidi kaldır',
          ].join('\n'),
          inline: false
        },
        {
          name: '📋 Log Komutları',
          value: [
            '`!logs [sayı]` — Son logları görüntüle (max 25)',
          ].join('\n'),
          inline: false
        },
        {
          name: '🌐 Dashboard',
          value: '`http://localhost:3000` — Web arayüzünden yönet',
          inline: false
        },
        {
          name: '🎵 Müzik Komutları',
          value: [
            '`!join` — Ses kanalına bağlan (`!gel`, `!bağlan`)',
            '`!left` — Ses kanalından ayrıl (`!leave`, `!ayrıl`, `!çık`)',
            '`!play <şarkı/URL>` — YouTube\'dan şarkı çal (`!p`, `!çal`)',
            '`!skip` — Sıradaki şarkıya geç (`!s`, `!geç`)',
            '`!stop` — Müziği durdur ve kuyruğu temizle (`!dc`)',
            '`!pause` — Şarkıyı duraklat (`!duraklat`)',
            '`!resume` — Duraklatılmış şarkıyı devam ettir (`!devam`)',
            '`!queue` — Kuyruk listesini göster (`!q`, `!kuyruk`)',
            '`!nowplaying` — Şu an çalanı göster (`!np`)',
            '`!volume <1-100>` — Ses seviyesini ayarla (`!ses`)',
            '`!loop <none|song|queue>` — Döngü modunu ayarla',
          ].join('\n'),
          inline: false
        },
      )
      .setTimestamp()
      .setFooter({ text: `Prefix: ${config.prefix} • AntiRaid Bot` });

    message.reply({ embeds: [embed] });
  }
};
