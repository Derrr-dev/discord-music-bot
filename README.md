# 🎵 Discord Music Bot — Full Featured

Bot musik Discord lengkap dengan integrasi Spotify, dukungan antrian, playlist, lirik, dan banyak fitur lainnya. **Bot ini bersifat publik — siapapun bisa mengundangnya ke server mereka!**

## 🔗 Invite Bot ke Server

```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=36793408&scope=bot+applications.commands
```

> Ganti `YOUR_CLIENT_ID` dengan Client ID dari [Discord Developer Portal](https://discord.com/developers/applications)

### Permission yang diperlukan (36793408):
| Permission | Fungsi |
|-----------|--------|
| Send Messages | Kirim pesan & embed |
| Embed Links | Tampilkan embed musik |
| Read Message History | Baca history pesan |
| Add Reactions | Tambah reaksi |
| Manage Messages | Hapus pesan bot |
| Connect | Masuk voice channel |
| Speak | Putar audio di voice |
| Use Voice Activity | Streaming audio |

---

## ✨ Fitur Lengkap

| Fitur | Deskripsi |
|-------|-----------|
| ▶️ Play/Pause/Resume/Stop | Kontrol penuh pemutaran musik |
| ⏭️ Skip / ⏮️ Previous | Navigasi antar lagu |
| 📋 Queue (Antrian) | Antrian hingga 200 lagu |
| 🔂 Loop | Ulangi lagu atau seluruh antrian |
| 🔀 Shuffle | Acak urutan lagu |
| 🔊 Volume Control | Atur volume 1-100% |
| 📜 Lirik | Tampilkan lirik lagu via Genius |
| 🎵 Autoplay | Rekomendasi otomatis via Spotify |
| 📜 Riwayat | Riwayat 50 lagu terakhir per pengguna |
| ❤️ Favorit | Simpan lagu favorit |
| 📋 Playlist | Buat & kelola playlist pribadi |
| 🔍 Search | Cari dan pilih dari hasil pencarian |
| ⏩ Seek | Lompat ke waktu tertentu |
| 🌐 Multi Bahasa | Bahasa Indonesia & English |
| ⚙️ Admin Panel | Pengaturan server via `/settings` |
| 🎮 Button Controls | Kontrol via tombol interaktif |
| 🎵 Spotify Link | Support URL Spotify (track/playlist/album) |

---

## 📋 Daftar Perintah (Slash Commands)

### 🎵 Musik
| Perintah | Deskripsi |
|---------|-----------|
| `/play <query>` | Putar lagu (nama, URL YouTube, link Spotify) |
| `/pause` | Jeda musik |
| `/resume` | Lanjutkan musik |
| `/stop` | Hentikan dan kosongkan antrian |
| `/skip` | Lewati lagu saat ini |
| `/previous` | Kembali ke lagu sebelumnya |
| `/queue [page]` | Lihat antrian lagu |
| `/nowplaying` | Lagu yang sedang diputar |
| `/loop <mode>` | Mode ulangi (off/track/queue) |
| `/shuffle` | Toggle acak antrian |
| `/volume [level]` | Atur volume (1-100) |
| `/seek <time>` | Lompat ke waktu (1:30 atau 90) |
| `/lyrics [query]` | Tampilkan lirik lagu |
| `/search <query>` | Cari dan pilih lagu |
| `/autoplay` | Toggle putar otomatis rekomendasi |

### ❤️ Favorit & Riwayat
| Perintah | Deskripsi |
|---------|-----------|
| `/favorite add` | Tambah lagu ke favorit |
| `/favorite remove <index>` | Hapus dari favorit |
| `/favorite list [page]` | Lihat daftar favorit |
| `/favorite play` | Putar semua favorit |
| `/history view [page]` | Lihat riwayat diputar |
| `/history clear` | Hapus riwayat |

### 📋 Playlist
| Perintah | Deskripsi |
|---------|-----------|
| `/playlist create <name>` | Buat playlist baru |
| `/playlist delete <name>` | Hapus playlist |
| `/playlist add <name>` | Tambah lagu ke playlist |
| `/playlist remove <name> <index>` | Hapus lagu dari playlist |
| `/playlist list` | Lihat semua playlist |
| `/playlist view <name>` | Lihat lagu dalam playlist |
| `/playlist play <name>` | Putar playlist |
| `/playlist rename <name> <newname>` | Ubah nama playlist |

### ⚙️ Admin (Butuh izin Manage Guild)
| Perintah | Deskripsi |
|---------|-----------|
| `/settings view` | Lihat pengaturan server |
| `/settings language <lang>` | Ubah bahasa (id/en) |
| `/settings djrole [role]` | Atur peran DJ |
| `/settings volume <level>` | Volume default |
| `/settings announce <true/false>` | Umumkan lagu baru |
| `/settings maxqueue <size>` | Batas antrian (10-500) |

---

## 🌐 Cara Membuat Bot Publik (Owner)

Agar siapapun bisa invite bot Anda:

1. Buka [Discord Developer Portal](https://discord.com/developers/applications)
2. Pilih aplikasi bot Anda
3. **Tab "Bot":**
   - ✅ Aktifkan **"Public Bot"**
   - ✅ Presence Intent
   - ✅ Server Members Intent
   - ✅ Message Content Intent
4. **Tab "Installation"** → Guild Install ✅
5. Bagikan link invite:
   ```
   https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=36793408&scope=bot+applications.commands
   ```

---

## 🚀 Setup & Instalasi (Self-Host)

### 1. Prasyarat
- Node.js v18 atau lebih baru
- Akun Discord Developer
- Akun Spotify Developer

### 2. Clone & Install
```bash
git clone https://github.com/Derrr-dev/discord-music-bot.git
cd discord-music-bot
npm install
```

### 3. Konfigurasi Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
DISCORD_TOKEN=token_bot_anda
DISCORD_CLIENT_ID=client_id_anda
SPOTIFY_CLIENT_ID=spotify_client_id
SPOTIFY_CLIENT_SECRET=spotify_client_secret
GENIUS_API_KEY=genius_api_key_opsional
```

### 4. Deploy Slash Commands
```bash
# Deploy global (berlaku di semua server, butuh ~1 jam)
npm run deploy

# Deploy ke satu server (instan, untuk testing)
GUILD_ID=id_server npm run deploy
```

### 5. Jalankan Bot
```bash
# Development
npm run dev

# Production
npm run build && npm start
```

---

## 🌐 Deploy ke Pella.app

1. Push ke GitHub (sudah dilakukan ✅)
2. Buka [pella.app](https://www.pella.app/)
3. Connect ke repo: `Derrr-dev/discord-music-bot`
4. Set environment variables di dashboard
5. Deploy!

---

## 🔧 Cara Mendapatkan Token

### Discord Bot Token
1. [discord.com/developers/applications](https://discord.com/developers/applications) → New Application
2. Bot → Add Bot → Reset Token → copy
3. Aktifkan semua 3 Privileged Gateway Intents

### Spotify API
1. [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) → Create App
2. Copy Client ID & Client Secret

### Genius Lyrics (Opsional)
1. [genius.com/api-clients](https://genius.com/api-clients) → New API Client
2. Copy Client Access Token

---

## 🏗️ Struktur Proyek

```
discord-music-bot/
├── src/
│   ├── commands/
│   │   ├── music/       # play, pause, skip, queue, lyrics, search, dll
│   │   └── admin/       # settings
│   ├── events/          # ready, interactionCreate, voiceStateUpdate
│   ├── handlers/        # commandHandler, eventHandler
│   ├── music/           # MusicPlayer, Queue, Track, PlayerManager
│   ├── services/        # SpotifyService, LyricsService
│   ├── database/        # SQLite (playlists, favorites, history)
│   ├── utils/           # embeds, i18n, helpers
│   ├── locales/         # id.json (Indonesian), en.json (English)
│   ├── types/           # TypeScript interfaces
│   ├── bot.ts           # Setup client
│   ├── index.ts         # Entry point
│   └── deploy-commands.ts
├── .env.example
├── package.json
└── tsconfig.json
```

## 📝 Tech Stack
- **Runtime**: Node.js 18+ / TypeScript
- **Discord**: discord.js v14 + @discordjs/voice
- **Audio**: play-dl + FFmpeg (YouTube streaming)
- **Spotify**: spotify-web-api-node (metadata only)
- **Lyrics**: genius-lyrics
- **Database**: better-sqlite3 (SQLite lokal)
- **i18n**: i18next

## 📄 Lisensi
MIT License — bebas digunakan dan dimodifikasi
