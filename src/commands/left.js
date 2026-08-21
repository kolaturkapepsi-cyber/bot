const music = require('../music/MusicPlayer');
const { getVoiceConnection } = require('@discordjs/voice');
module.exports = {
  name: 'left', aliases: ['leave', 'ayrıl', 'çık'],
  description: 'Ses kanalından ayrılır.', usage: '!left',
  async execute(message) {
    if (!message.member?.voice?.channel) return message.reply('❌ Ses kanalında olman gerekiyor!');
    const data = music.getQueue(message.guild.id);
    if (data) {
      music.stop(message.guild.id);
    } else {
      const conn = getVoiceConnection(message.guild.id);
      if (!conn) return message.reply('❌ Bot zaten bir kanalda değil.');
      conn.destroy();
    }
    message.reply('👋 Ses kanalından ayrıldım.');
  },
};
