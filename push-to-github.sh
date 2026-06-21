#!/bin/bash
# Script untuk push project ke GitHub
# Usage: ./push-to-github.sh <github-token> <github-username> <repo-name>

GITHUB_TOKEN=$1
GITHUB_USERNAME=$2
REPO_NAME=${3:-"discord-music-bot"}

if [ -z "$GITHUB_TOKEN" ] || [ -z "$GITHUB_USERNAME" ]; then
  echo "❌ Usage: ./push-to-github.sh <github-token> <github-username> [repo-name]"
  echo ""
  echo "📋 Cara mendapatkan GitHub Token:"
  echo "  1. Buka https://github.com/settings/tokens"
  echo "  2. Generate new token (classic)"
  echo "  3. Centang permission: repo"
  echo "  4. Copy token"
  exit 1
fi

echo "🚀 Memulai push ke GitHub..."
echo "👤 Username: $GITHUB_USERNAME"
echo "📦 Repo: $REPO_NAME"

# Check if repo exists, create if not
echo "📡 Mengecek/membuat repository..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$GITHUB_USERNAME/$REPO_NAME")

if [ "$HTTP_STATUS" = "404" ]; then
  echo "📁 Membuat repository baru: $REPO_NAME"
  curl -s -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$REPO_NAME\",\"description\":\"Full-featured Discord Music Bot with Spotify integration\",\"private\":false}" \
    "https://api.github.com/user/repos" > /dev/null

  if [ $? -ne 0 ]; then
    echo "❌ Gagal membuat repository!"
    exit 1
  fi
  echo "✅ Repository berhasil dibuat"
else
  echo "✅ Repository sudah ada"
fi

# Init git in current directory
if [ ! -d ".git" ]; then
  git init
  echo "✅ Git initialized"
fi

# Configure git
git config user.name "$GITHUB_USERNAME"
git config user.email "$GITHUB_USERNAME@users.noreply.github.com"

# Add remote
git remote remove origin 2>/dev/null || true
git remote add origin "https://$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/$REPO_NAME.git"

# Stage and commit
git add .
git commit -m "🎵 Initial commit: Discord Music Bot full-featured

Features:
- Play/Pause/Resume/Stop/Skip/Previous
- Queue management (up to 200 songs)
- Loop (track/queue), Shuffle, Autoplay
- Spotify link support (metadata)
- Favorites & Play History
- User Playlists
- Lyrics via Genius API
- Slash commands with button controls
- Multi-language (Indonesian/English)
- Admin settings panel
- SQLite database"

# Push to GitHub
echo "📤 Push ke GitHub..."
git branch -M main
git push -u origin main --force

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Berhasil! Project sudah di GitHub:"
  echo "🔗 https://github.com/$GITHUB_USERNAME/$REPO_NAME"
  echo ""
  echo "🚀 Langkah selanjutnya:"
  echo "  1. Buka https://www.pella.app/"
  echo "  2. Connect ke repo: $GITHUB_USERNAME/$REPO_NAME"
  echo "  3. Set environment variables"
  echo "  4. Deploy!"
else
  echo "❌ Push gagal! Cek token GitHub Anda."
  exit 1
fi
