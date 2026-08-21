const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../../config');

// guildId → { ownerId, channelId } — bellekte tutar (bot restart'ta sıfırlanır)
const privateRooms = new Map();

module.exports = {
  name: 'oda',
  aliases: ['room', 'voice'],
  description: 'Özel ses odası oluşturur ve yönetir.',
  usage: '!oda <aç|kapat|kilitle|aç|davet|at|limit|isim>',

  async execute(message, args) {
    const sub = args[0]?.toLowerCase();

    if (!sub || sub === 'aç') {
      return this.createRoom(message);
    }

    switch (sub) {
      case 'kapat':   return this.deleteRoom(message);
      case 'kilitle': return this.lockRoom(message, true);
      case 'kilidaç': return this.lockRoom(message, false);
      case 'davet':   return this.inviteUser(message);
      case 'at':      return this.kickUser(message);
      case 'limit':   return this.setLimit(message, args[1]);
      case 'isim':    return this.rename(message, args.slice(1).join(' '));
      default:
        return message.reply('❓ Alt komutlar: `aç`, `kapat`, `kilitle`, `kilidaç`, `davet @kullanıcı`, `at @kullanıcı`, `limit <sayı>`, `isim <ad>`');
    }
  },

  // ── Oda oluştur ──
  async createRoom(message) {
    const existing = privateRooms.get(`${message.guild.id}-${message.author.id}`);
    if (existing) {
      const ch = message.guild.channels.cache.get(existing.channelId);
      if (ch) return message.reply(`❌ Zaten bir özel odanız var: ${ch}`);
      privateRooms.delete(`${message.guild.id}-${message.author.id}`);
    }

    try {
      const channel = await message.guild.channels.create({
        name: `🔒 ${message.author.username}'in Odası`,
        type: ChannelType.GuildVoice,
        permissionOverwrites: [
          {
            id: message.guild.id, // @everyone
            deny: [PermissionFlagsBits.Connect],
          },
          {
            id: message.author.id,
            allow: [
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.MoveMembers,
            ],
          },
          {
            id: message.client.user.id,
            allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ManageChannels],
          },
        ],
      });

      privateRooms.set(`${message.guild.id}-${message.author.id}`, {
        ownerId: message.author.id,
        channelId: channel.id,
      });

      const embed = new EmbedBuilder()
        .setColor(config.successColor)
        .setTitle('🔒 Özel Oda Oluşturuldu')
        .setDescription(`${channel} odanız hazır!`)
        .addFields(
          { name: '👑 Sahip', value: message.author.username, inline: true },
          { name: '📋 Komutlar', value: '`!oda davet @kullanıcı` — Davet et\n`!oda at @kullanıcı` — At\n`!oda kilitle` — Kilitle\n`!oda kilidaç` — Kilidi kaldır\n`!oda kapat` — Odayı sil', inline: false },
        )
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (err) {
      message.reply(`❌ Oda oluşturulamadı: \`${err.message}\``);
    }
  },

  // ── Oda sil ──
  async deleteRoom(message) {
    const room = this._getOwnedRoom(message);
    if (!room) return;

    const channel = message.guild.channels.cache.get(room.channelId);
    if (!channel) {
      privateRooms.delete(`${message.guild.id}-${message.author.id}`);
      return message.reply('❌ Oda bulunamadı, kayıt silindi.');
    }

    await channel.delete('Özel oda sahibi tarafından silindi.');
    privateRooms.delete(`${message.guild.id}-${message.author.id}`);
    message.reply('✅ Özel odanız silindi.');
  },

  // ── Kilitle / Kilidi aç ──
  async lockRoom(message, lock) {
    const room = this._getOwnedRoom(message);
    if (!room) return;

    const channel = message.guild.channels.cache.get(room.channelId);
    if (!channel) return message.reply('❌ Oda bulunamadı.');

    await channel.permissionOverwrites.edit(message.guild.id, {
      Connect: lock ? false : null,
    });

    message.reply(lock ? '🔒 Oda kilitlendi. Kimse giremez.' : '🔓 Oda kilidi kaldırıldı.');
  },

  // ── Kullanıcı davet et ──
  async inviteUser(message) {
    const room = this._getOwnedRoom(message);
    if (!room) return;

    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Kullanım: `!oda davet @kullanıcı`');

    const channel = message.guild.channels.cache.get(room.channelId);
    if (!channel) return message.reply('❌ Oda bulunamadı.');

    await channel.permissionOverwrites.edit(target.id, {
      Connect: true,
      Speak: true,
    });

    message.reply(`✅ **${target.user.username}** odaya davet edildi.`);
    target.send(`📩 **${message.author.username}** sizi özel odaya davet etti: ${channel}`).catch(() => {});
  },

  // ── Kullanıcıyı at ──
  async kickUser(message) {
    const room = this._getOwnedRoom(message);
    if (!room) return;

    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Kullanım: `!oda at @kullanıcı`');

    const channel = message.guild.channels.cache.get(room.channelId);
    if (!channel) return message.reply('❌ Oda bulunamadı.');

    // İzni kaldır
    await channel.permissionOverwrites.edit(target.id, { Connect: false });

    // Odadaysa çıkar
    if (target.voice?.channelId === channel.id) {
      await target.voice.disconnect('Özel odadan çıkarıldı.');
    }

    message.reply(`✅ **${target.user.username}** odadan çıkarıldı.`);
  },

  // ── Kullanıcı limiti ──
  async setLimit(message, limitStr) {
    const room = this._getOwnedRoom(message);
    if (!room) return;

    const limit = parseInt(limitStr);
    if (isNaN(limit) || limit < 0 || limit > 99) {
      return message.reply('❌ Limit 0-99 arasında olmalı. (0 = sınırsız)');
    }

    const channel = message.guild.channels.cache.get(room.channelId);
    if (!channel) return message.reply('❌ Oda bulunamadı.');

    await channel.setUserLimit(limit);
    message.reply(`✅ Kullanıcı limiti **${limit === 0 ? 'sınırsız' : limit}** olarak ayarlandı.`);
  },

  // ── Oda ismi değiştir ──
  async rename(message, newName) {
    const room = this._getOwnedRoom(message);
    if (!room) return;

    if (!newName) return message.reply('❌ Kullanım: `!oda isim <yeni isim>`');

    const channel = message.guild.channels.cache.get(room.channelId);
    if (!channel) return message.reply('❌ Oda bulunamadı.');

    await channel.setName(`🔒 ${newName}`);
    message.reply(`✅ Oda ismi **🔒 ${newName}** olarak değiştirildi.`);
  },

  // ── Yardımcı: Odanın sahibi mi? ──
  _getOwnedRoom(message) {
    const room = privateRooms.get(`${message.guild.id}-${message.author.id}`);
    if (!room) {
      message.reply('❌ Aktif bir özel odanız yok. `!oda aç` ile oluşturun.');
      return null;
    }
    return room;
  },
};
