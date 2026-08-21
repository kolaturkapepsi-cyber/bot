/**
 * JsonDB — MongoDB yerine JSON dosya tabanlı veri saklama
 * Her sunucu için ayrı bir dosya: data/guilds/<guildId>.json
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'guilds');

// data/guilds klasörünü oluştur
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Varsayılan guild verisi
function defaultGuild(guildId, guildName = '') {
  return {
    guildId,
    guildName,
    antiRaid: {
      enabled: true,
      lockdown: false,
      action: 'ban',
      joinThreshold: 5,
      joinInterval: 5000,
      spamThreshold: 5,
      spamInterval: 5000,
      mentionThreshold: 5,
      mentionInterval: 5000,
      channelThreshold: 3,
      channelInterval: 10000,
      newAccountAge: 7,
      whitelistedRoles: [],
      whitelistedUsers: [],
      logChannel: null,
    },
    stats: {
      totalRaidsBlocked: 0,
      totalSpamBlocked: 0,
      totalBans: 0,
      totalKicks: 0,
      totalMutes: 0,
      lastRaidAt: null,
    },
    logs: [],
  };
}

function filePath(guildId) {
  return path.join(DATA_DIR, `${guildId}.json`);
}

// ── Oku ──
function read(guildId) {
  const fp = filePath(guildId);
  if (!fs.existsSync(fp)) return null;
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch {
    return null;
  }
}

// ── Yaz ──
function write(guildId, data) {
  fs.writeFileSync(filePath(guildId), JSON.stringify(data, null, 2), 'utf8');
}

// ── findOne ── (her zaman bir değer döner, yoksa default oluşturur)
function findOne(guildId) {
  let data = read(guildId);
  if (!data) {
    data = defaultGuild(guildId);
    write(guildId, data);
  }
  return data;
}

// ── Derin güncelleme yardımcısı ──
function deepSet(obj, dotPath, value) {
  const keys = dotPath.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] === undefined) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

// ── findOneAndUpdate ── (MongoDB findOneAndUpdate eşdeğeri)
// update: düz key→value nesnesi veya özel operatörler
function findOneAndUpdate(guildId, update, options = {}) {
  let data = read(guildId);
  if (!data) {
    data = defaultGuild(guildId);
  }

  // $set benzeri: düz alanlar
  if (update.$inc) {
    for (const [key, val] of Object.entries(update.$inc)) {
      const cur = getDeep(data, key) || 0;
      deepSet(data, key, cur + val);
    }
  }

  if (update.$set) {
    for (const [key, val] of Object.entries(update.$set)) {
      deepSet(data, key, val);
    }
  }

  if (update.$push) {
    for (const [key, val] of Object.entries(update.$push)) {
      const arr = getDeep(data, key) || [];
      if (val && val.$each) {
        arr.push(...val.$each);
        const slice = val.$slice;
        if (slice && slice < 0) {
          deepSet(data, key, arr.slice(slice));
        } else {
          deepSet(data, key, arr);
        }
      } else {
        arr.push(val);
        deepSet(data, key, arr);
      }
    }
  }

  if (update.$addToSet) {
    for (const [key, val] of Object.entries(update.$addToSet)) {
      const arr = getDeep(data, key) || [];
      if (!arr.includes(val)) arr.push(val);
      deepSet(data, key, arr);
    }
  }

  if (update.$pull) {
    for (const [key, val] of Object.entries(update.$pull)) {
      const arr = getDeep(data, key) || [];
      deepSet(data, key, arr.filter(v => v !== val));
    }
  }

  // Düz güncelleme (MongoDB dot-notation: 'antiRaid.enabled': true)
  for (const [key, val] of Object.entries(update)) {
    if (key.startsWith('$')) continue;
    deepSet(data, key, val);
  }

  write(guildId, data);
  return data;
}

function getDeep(obj, dotPath) {
  return dotPath.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
}

// ── Tüm sunucuları listele ──
function listAll() {
  if (!fs.existsSync(DATA_DIR)) return [];
  return fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')); } catch { return null; }
    })
    .filter(Boolean);
}

module.exports = { findOne, findOneAndUpdate, listAll, defaultGuild, DATA_DIR };
