const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  guildName: { type: String },
  
  antiRaid: {
    enabled: { type: Boolean, default: true },
    lockdown: { type: Boolean, default: false },
    action: { type: String, default: 'ban', enum: ['kick', 'ban', 'mute', 'lockdown'] },
    
    joinThreshold: { type: Number, default: 5 },
    joinInterval: { type: Number, default: 5000 },
    
    spamThreshold: { type: Number, default: 5 },
    spamInterval: { type: Number, default: 5000 },
    
    mentionThreshold: { type: Number, default: 5 },
    mentionInterval: { type: Number, default: 5000 },
    
    channelThreshold: { type: Number, default: 3 },
    channelInterval: { type: Number, default: 10000 },
    
    newAccountAge: { type: Number, default: 7 },
    
    whitelistedRoles: [{ type: String }],
    whitelistedUsers: [{ type: String }],
    logChannel: { type: String, default: null },
  },

  stats: {
    totalRaidsBlocked: { type: Number, default: 0 },
    totalSpamBlocked: { type: Number, default: 0 },
    totalBans: { type: Number, default: 0 },
    totalKicks: { type: Number, default: 0 },
    totalMutes: { type: Number, default: 0 },
    lastRaidAt: { type: Date, default: null },
  },

  logs: [{
    type: { type: String },
    userId: String,
    username: String,
    reason: String,
    action: String,
    timestamp: { type: Date, default: Date.now }
  }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

guildSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Guild', guildSchema);
