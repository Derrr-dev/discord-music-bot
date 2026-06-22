const { SlashCommandBuilder } = require("discord.js");
const { playerManager } = require("../../music/PlayerManager");
const { resolveQuery } = require("../../utils/helpers");
const { createErrorEmbed, createSuccessEmbed, createNowPlayingEmbed, createMusicControls } = require("../../utils/embeds");
const { db } = require("../../database/Database");
const { t } = require("../../utils/i18n");

const command = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Putar lagu / Play a song")
    .addStringOption(o => o.setName("query").setDescription("Nama lagu, URL YouTube, atau link Spotify").setRequired(true)),
  voiceRequired: true,

  async execute(interaction, client) {
    const settings = db.getGuildSettings(interaction.guildId);
    const lang = settings.language;
    const query = interaction.options.getString("query", true);
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return void interaction.reply({ embeds: [createErrorEmbed(t("common.notInVoice", lang))], ephemeral: true });
    }

    await interaction.deferReply();

    if (query.includes("spotify.com") || query.startsWith("spotify:")) {
      await interaction.editReply({ embeds: [createSuccessEmbed(t("play.spotifyLink", lang))] });
    }

    try {
      let player = playerManager.get(interaction.guildId);
      if (!player || player.isDestroyed()) {
        player = await playerManager.create(interaction.guildId, voiceChannel, interaction.channel);
      }

      const result = await resolveQuery(query, interaction.user.username, interaction.user.id);

      if (!result || result.tracks.length === 0) {
        return void interaction.editReply({ embeds: [createErrorEmbed(t("play.notFound", lang, { query }))] });
      }

      const { tracks, isPlaylist, playlistName } = result;
      const maxQueue = settings.maxQueueSize;

      if (isPlaylist) {
        const toAdd = tracks.slice(0, maxQueue);
        for (const track of toAdd) await player.play(track);
        await interaction.editReply({
          embeds: [createSuccessEmbed(t("play.addedPlaylist", lang, { count: toAdd.length, name: playlistName || "Playlist" }))],
        });
      } else {
        const track = tracks[0];
        await player.play(track);
        if (player.queue.all.length === 1) {
          await interaction.editReply({ embeds: [createNowPlayingEmbed(track, player.queue, lang)], components: [createMusicControls()] });
        } else {
          await interaction.editReply({ embeds: [createSuccessEmbed(t("play.added", lang, { title: track.title }))] });
        }
      }
    } catch (err) {
      console.error(err);
      await interaction.editReply({ embeds: [createErrorEmbed(t("common.error", lang))] });
    }
  },
};

module.exports = { command };
