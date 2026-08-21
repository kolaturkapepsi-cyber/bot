module.exports = {
  // Bot Ayarları
  prefix: '!',
  embedColor: '#5865F2',
  errorColor: '#ED4245',
  successColor: '#57F287',
  warnColor: '#FEE75C',

  // Raid Koruma Varsayılan Ayarları
  antiRaid: {
    // Kaç saniye içinde kaç kullanıcı join ederse raid sayılır
    joinThreshold: 5,        // kaç kullanıcı
    joinInterval: 5000,      // milisaniye (5 saniye)

    // Aynı mesajı kaç kez gönderirse spam sayılır
    spamThreshold: 5,        // kaç mesaj
    spamInterval: 5000,      // milisaniye

    // Kaç saniyede kaç mention spam sayılır
    mentionThreshold: 5,     // kaç mention
    mentionInterval: 5000,   // milisaniye

    // Kaç saniyede kaç kanal oluşturma/silme işlemi
    channelThreshold: 3,
    channelInterval: 10000,

    // Raid tespit edilince yapılacak işlem: 'kick', 'ban', 'mute', 'lockdown'
    action: 'ban',

    // Yeni hesap kontrolü (gün cinsinden)
    newAccountAge: 7,

    // Lockdown modu - yeni üye girişlerini engeller
    lockdown: false,
  },

  // Dashboard Ayarları
  dashboard: {
    port: 3000,
    secret: process.env.SESSION_SECRET || 'supersecretkey',
    callbackUrl: process.env.CALLBACK_URL || 'https://bot-production-32b4.up.railway.app/auth/callback',
  }
};
