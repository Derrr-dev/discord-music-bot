const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ComponentType } = require("discord.js");
const { playerManager } = require("../../music/PlayerManager");
const { searchMultiple, truncate } = require("../../utils/helpers");
const { Track } = require("../../music/Track");
const { createErrorEmbed, createSearchEmbed, createSuccessEmbed, createNowPlayingEmbed } = require("../../utils/embeds");
const { db } = require("../../database/Database");
const { t } = require("../../utils/i18n");

const command = {
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Cari lagu dan pilih dari hasil / Search and choose a song")
    .addStringOption(o => o.setName("query").setDescription("Nama lagu / Song name").setRequired(true)),
  async execute(interaction) {
    const { language: lang } = db.getGuildSettings(interaction.guildId);
    const query = interaction.options.getString("query", true);
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) return void interaction.reply({ embeds: [createErrorEmbed(t("common.notInVoice", lang))], ephemeral: true });

    await interaction.deferReply();
    const results = await searchMultiple(query, 10);
    if (!results?.length) return void interaction.editReply({ embeds: [createErrorEmbed(t("search.noResults", lang, { query }))] });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("search_select")
      .setPlaceholder(t("search.select", lang))
      .addOptions(results.slice(0, 10).map((r, i) => {
        const dur = r.durationInSec ? `${Math.floor(r.durationInSec / 60)}:${String(r.durationInSec % 60).padStart(2, "0")}` : "?:??";
        return new StringSelectMenuOptionBuilder()
          .setLabel(truncate(r.title || "Unknown", 100))
          .setDescription(`${r.channel?.name || "Unknown"} • ${dur}`)
          .setValue(String(i));
      }));

    const reply = await interaction.editReply({ embeds: [createSearchEmbed(results, lang)], components: [new ActionRowBuilder().addComponents(selectMenu)] });
    const collector = reply.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 30_000, filter: i => i.user.id === interaction.user.id });

    collector.on("collect", async sel => {
      const chosen = results[parseInt(sel.values[0])];
      const track = new Track({
        title: chosen.title || "Unknown", artist: chosen.channel?.name || "Unknown",
        album: "", duration: (chosen.durationInSec || 0) * 1000,
        url: chosen.url, thumbnail: chosen.thumbnails?.[0]?.url || "",
        source: "search", requestedBy: interaction.user.username,
        requestedById: interaction.user.id, youtubeId: chosen.id,
      });

      let player = playerManager.get(interaction.guildId);
      if (!player || player.isDestroyed()) player = await playerManager.create(interaction.guildId, voiceChannel, interaction.channel);
      await player.play(track);
      collector.stop("selected");

      if (player.queue.all.length === 1) {
        await sel.update({ embeds: [createNowPlayingEmbed(track, player.queue, lang)], components: [] });
      } else {
        await sel.update({ embeds: [createSuccessEmbed(t("play.added", lang, { title: track.title }))], components: [] });
      }
    });

    collector.on("end", async (_, reason) => {
      if (reason !== "selected") await interaction.editReply({ components: [] }).catch(() => {});
    });
  },
};
module.exports = { command };
