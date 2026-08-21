const { useQueue } = require('discord-player');

module.exports = {
  name: 'volume',
  aliases: ['vol', 'ses'],
  description: 'Ses seviyesini ayarlar (1-100).',
  usage: '!volume <1-100>',

  async execute(message, args) {
    const queue = useQueue(message.guild.id);
    if (!queue?.isPlaying()) return message.reply('❌ Şu an çalan bir şarkı yok.');
    if (!message.member?.voice?.channel) return message.reply('❌ Bir ses kanalında olman gerekiyor!');

    if (!args[0]) return message.reply(`🔊 Mevcut ses: **%${queue.node.volume}**`);

    const vol = parseInt(args[0]);
    if (isNaN(vol) || vol < 1 || vol > 100) return message.reply('❌ Ses seviyesi 1-100 arasında olmalı.');

    queue.node.setVolume(vol);
    message.reply(`🔊 Ses seviyesi **%${vol}** olarak ayarlandı.`);
  },
};
