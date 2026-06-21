# 🎵 Discord Music Bot — Full Featured

Bot musik Discord lengkap dengan integrasi Spotify, dukungan antrian, playlist, lirik, dan banyak fitur lainnya.

## ✨ Fitur

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
| 🔴 Status Now Playing | Tampilan lagu yang sedang diputar |
| 🎵 Spotify Link | Support URL Spotify (track/playlist/album) |
| 🎮 Button Controls | Kontrol via tombol interaktif di Discord |

## 📋 Daftar Perintah

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

## 🚀 Setup & Instalasi

### 1. Prasyarat
- Node.js v18 atau lebih baru
- FFmpeg (sudah termasuk via `ffmpeg-static`)
- Akun Discord Developer
- Akun Spotify Developer

### 2. Clone & Install
```bash
git clone <repo-url>
cd discord-music-bot
npm install
```

### 3. Konfigurasi Environment
```bash
cp .env.example .env
```

Edit `.env` dan isi:
- `DISCORD_TOKEN` — Token bot dari [Discord Developer Portal](https://discord.com/developers/applications)
- `DISCORD_CLIENT_ID` — Client ID dari halaman yang sama
- `SPOTIFY_CLIENT_ID` — Dari [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
- `SPOTIFY_CLIENT_SECRET` — Dari dashboard yang sama
- `GENIUS_API_KEY` — Dari [Genius API](https://genius.com/api-clients) (opsional, untuk lirik)

### 4. Deploy Slash Commands
```bash
# Deploy global (butuh 1 jam)
npm run deploy

# Deploy ke satu guild (instan, untuk testing)
GUILD_ID=your_guild_id npm run deploy
```

### 5. Jalankan Bot
```bash
# Development
npm run dev

# Production (setelah build)
npm run build
npm start
```

## 🌐 Deploy ke Pella.app

1. Push ke GitHub (lihat bagian bawah)
2. Buka [pella.app](https://www.pella.app/)
3. Connect ke GitHub repo
4. Atur environment variables di dashboard Pella
5. Deploy!

Pella memerlukan variabel:
```
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
GENIUS_API_KEY=
```

## 🔧 Cara Dapat Token

### Discord Bot Token
1. Buka [discord.com/developers/applications](https://discord.com/developers/applications)
2. New Application → beri nama
3. Bot → Add Bot → Reset Token → copy
4. Aktifkan: `PRESENCE INTENT`, `SERVER MEMBERS INTENT`, `MESSAGE CONTENT INTENT`
5. OAuth2 → URL Generator → pilih `bot` + `applications.commands`
6. Pilih permissions: `Connect`, `Speak`, `Send Messages`, `Embed Links`, `Read Message History`
7. Copy URL dan invite bot ke server

### Spotify API
1. Buka [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Create App
3. Copy Client ID dan Client Secret

### Genius Lyrics (Opsional)
1. Buka [genius.com/api-clients](https://genius.com/api-clients)
2. New API Client
3. Copy Client Access Token

## 🏗️ Struktur Proyek

```
discord-music-bot/
├── src/
│   ├── commands/
│   │   ├── music/          # Semua perintah musik
│   │   └── admin/          # Perintah admin
│   ├── events/             # Discord events
│   ├── handlers/           # Command & event loaders
│   ├── music/              # MusicPlayer, Queue, Track
│   ├── services/           # Spotify & Lyrics API
│   ├── database/           # SQLite database
│   ├── utils/              # Embeds, i18n, helpers
│   ├── locales/            # id.json, en.json
│   ├── types/              # TypeScript types
│   ├── bot.ts              # Bot setup
│   ├── index.ts            # Entry point
│   └── deploy-commands.ts  # Deploy slash commands
├── data/                   # Database (auto-created)
├── .env.example
├── package.json
└── tsconfig.json
```

## 📝 Catatan Teknis

- **Audio source**: YouTube (via play-dl) — Spotify hanya digunakan untuk metadata
- **Database**: SQLite lokal (better-sqlite3) — data tersimpan per server + user
- **Voice**: @discordjs/voice dengan FFmpeg untuk streaming
- **Language**: TypeScript dengan strict mode

## 🤝 Kontribusi

Pull request dan issue sangat diterima!

## 📄 Lisensi

MIT License
