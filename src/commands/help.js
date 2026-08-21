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
          inline: false,
        },
        {
          name: '🔒 Özel Oda Komutları',
          value: [
            '`!oda` — Özel ses odası aç (`!oda aç`)',
            '`!oda kapat` — Odayı sil',
            '`!oda kilitle` — Odaya girişi engelle',
            '`!oda kilidaç` — Kilidi kaldır',
            '`!oda davet @kullanıcı` — Kullanıcıyı davet et',
            '`!oda at @kullanıcı` — Kullanıcıyı odadan çıkar',
            '`!oda limit <sayı>` — Kullanıcı limiti ayarla',
            '`!oda isim <ad>` — Oda adını değiştir',
          ].join('\n'),
          inline: false,
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
          inline: false,
        },
        {
          name: '🔐 Lockdown Komutları',
          value: [
            '`!lockdown` — Lockdown durumunu göster',
            '`!lockdown on` — Sunucuyu kilitle',
            '`!lockdown off` — Kilidi kaldır',
          ].join('\n'),
          inline: false,
        },
        {
          name: '📋 Log Komutları',
          value: ['`!logs [sayı]` — Son logları görüntüle (max 25)'].join('\n'),
          inline: false,
        },
        {
          name: '🌐 Dashboard',
          value: '`https://bot-production-32b4.up.railway.app` — Web arayüzünden yönet',
          inline: false,
        },
        {
          name: '🎵 Müzik Komutları',
          value: [
            '`!join` — Ses kanalına bağlan (`!gel`)',
            '`!left` — Ses kanalından ayrıl (`!leave`)',
            '`!play <şarkı/URL>` — Şarkı çal (`!p`, `!çal`)',
            '`!skip` — Sonraki şarkıya geç (`!s`)',
            '`!stop` — Müziği durdur (`!dc`)',
            '`!pause` — Duraklat',
            '`!resume` — Devam ettir',
            '`!queue` — Kuyruğu göster (`!q`)',
            '`!nowplaying` — Şu an çalanı göster (`!np`)',
            '`!volume <1-100>` — Ses seviyesi',
            '`!loop <none|song|queue>` — Döngü modu',
          ].join('\n'),
          inline: false,
        },
      )
      .setTimestamp()
      .setFooter({ text: `Prefix: ${config.prefix} • AntiRaid Bot` });

    message.reply({ embeds: [embed] });
  },
};
