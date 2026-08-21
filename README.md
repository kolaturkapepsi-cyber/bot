# 🛡️ AntiRaid Discord Botu

Gelişmiş raid koruması ve web dashboard'u olan bir Discord botu.

## Özellikler

- **Join Flood Koruması** — Kısa sürede çok sayıda üye katılımını algılar
- **Mesaj Spam Koruması** — Aynı kullanıcının çok hızlı mesaj göndermesini engeller
- **Mention Spam Koruması** — Toplu mention saldırılarını tespit eder
- **Kanal Spam Koruması** — Hızlı kanal oluşturma/silme işlemlerini engeller
- **Yeni Hesap Koruması** — Belirlenen günden genç hesapları otomatik atar
- **Otomatik Lockdown** — Raid tespit edilince sunucuyu anında kilitler
- **Whitelist Sistemi** — Güvenilir kullanıcı/rolleri koruma dışında tutar
- **Web Dashboard** — Tüm ayarları tarayıcıdan yönet, grafik ve logları takip et

## Kurulum

### 1. Gereksinimleri Yükle

Node.js 18+ ve MongoDB gereklidir.

```bash
npm install
```

### 2. .env Dosyasını Oluştur

```bash
copy .env.example .env
```

`.env` dosyasını açıp aşağıdaki değerleri doldur:

| Değişken | Açıklama |
|---|---|
| `BOT_TOKEN` | [Discord Developer Portal](https://discord.com/developers/applications) > Bot > Token |
| `CLIENT_ID` | Uygulama > OAuth2 > Client ID |
| `CLIENT_SECRET` | Uygulama > OAuth2 > Client Secret |
| `MONGODB_URI` | MongoDB bağlantı adresi |
| `SESSION_SECRET` | Rastgele güvenlik anahtarı |
| `CALLBACK_URL` | `http://localhost:3000/auth/callback` |

### 3. Discord Developer Portal Ayarları

1. [Discord Developer Portal](https://discord.com/developers/applications) adresine git
2. Uygulamanı seç > **OAuth2** sekmesi
3. **Redirects** bölümüne `http://localhost:3000/auth/callback` ekle
4. **Bot** sekmesinden şu izinleri aç:
   - `SERVER MEMBERS INTENT`
   - `MESSAGE CONTENT INTENT`

### 4. Botu Başlat

```bash
npm start
```

Dashboard: [http://localhost:3000](http://localhost:3000)

## Bot Komutları

| Komut | Açıklama | Yetki |
|---|---|---|
| `!help` | Tüm komutları listeler | Herkes |
| `!antiraid status` | Sistem durumunu gösterir | Administrator |
| `!antiraid on/off` | Sistemi açar/kapatır | Administrator |
| `!antiraid set <seçenek> <değer>` | Eşik değeri ayarlar | Administrator |
| `!antiraid action <ban\|kick\|mute>` | Ceza türünü ayarlar | Administrator |
| `!antiraid whitelist add/remove @hedef` | Whitelist yönetir | Administrator |
| `!antiraid logchannel #kanal` | Log kanalı ayarlar | Administrator |
| `!lockdown on/off` | Sunucuyu kilitler/açar | Administrator |
| `!logs [sayı]` | Son logları gösterir | Manage Guild |

### `!antiraid set` Seçenekleri

| Seçenek | Açıklama | Varsayılan |
|---|---|---|
| `joinThreshold` | Raid için join sayısı | 5 |
| `joinInterval` | Join kontrol süresi (ms) | 5000 |
| `spamThreshold` | Spam için mesaj sayısı | 5 |
| `spamInterval` | Spam kontrol süresi (ms) | 5000 |
| `mentionThreshold` | Mention spam eşiği | 5 |
| `mentionInterval` | Mention kontrol süresi (ms) | 5000 |
| `channelThreshold` | Kanal işlem eşiği | 3 |
| `channelInterval` | Kanal kontrol süresi (ms) | 10000 |
| `newAccountAge` | Min. hesap yaşı (gün) | 7 |

## Proje Yapısı

```
Discord Bot/
├── index.js                          # Ana bot dosyası
├── config.js                         # Yapılandırma
├── .env.example                      # Ortam değişkenleri şablonu
├── package.json
└── src/
    ├── antiraid/
    │   └── AntiRaid.js               # Raid koruma sistemi
    ├── commands/
    │   ├── antiraid.js               # AntiRaid komutları
    │   ├── lockdown.js               # Lockdown komutu
    │   ├── logs.js                   # Log görüntüleme
    │   └── help.js                   # Yardım komutu
    ├── database/
    │   ├── connect.js                # MongoDB bağlantısı
    │   └── models/
    │       └── Guild.js              # Sunucu veri modeli
    └── dashboard/
        ├── server.js                 # Express + OAuth2
        ├── views/                    # EJS şablonları
        │   ├── index.ejs
        │   ├── login.ejs
        │   ├── dashboard.ejs
        │   ├── guild.ejs
        │   ├── error.ejs
        │   └── partials/
        │       ├── navbar.ejs
        │       └── footer.ejs
        └── public/
            ├── css/style.css
            └── js/
                ├── main.js
                └── guild.js
```

## Teknolojiler

- [discord.js](https://discord.js.org) v14
- [Express](https://expressjs.com) v4
- [Passport Discord](https://github.com/nicholastay/passport-discord) — OAuth2
- [Mongoose](https://mongoosejs.com) — MongoDB ODM
- [EJS](https://ejs.co) — Template engine
- [Chart.js](https://chartjs.org) — İstatistik grafikleri
