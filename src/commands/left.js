const { useQueue } = require('discord-player');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
  name: 'left',
  aliases: ['leave', 'ayrıl', 'çık'],
  description: 'Botu ses kanalından çıkarır ve kuyruğu temizler.',
  usage: '!left',

  async execute(message) {
    if (!message.member?.voice?.channel) return message.reply('❌ Bir ses kanalında olman gerekiyor!');

    const queue = useQueue(message.guild.id);
    if (queue) {
      queue.delete();
    } else {
      const connection = getVoiceConnection(message.guild.id);
      if (!connection) return message.reply('❌ Bot zaten bir ses kanalında değil.');
      connection.destroy();
    }

    message.reply(`👋 Ses kanalından ayrıldım.`);
  },
};
