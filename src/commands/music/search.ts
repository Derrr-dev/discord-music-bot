import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ComponentType,
  GuildMember,
  VoiceChannel,
  TextChannel,
} from "discord.js";
import { Command, BotClient } from "../../types";
import { playerManager } from "../../music/PlayerManager";
import { searchMultiple } from "../../utils/helpers";
import { Track } from "../../music/Track";
import { createErrorEmbed, createSearchEmbed, createSuccessEmbed, createNowPlayingEmbed } from "../../utils/embeds";
import { db } from "../../database/Database";
import { t } from "../../utils/i18n";
import { truncate } from "../../utils/helpers";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Cari lagu dan pilih dari hasil / Search and choose a song")
    .addStringOption((o) =>
      o.setName("query").setDescription("Nama lagu / Song name").setRequired(true)
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const settings = db.getGuildSettings(interaction.guildId!);
    const lang = settings.language;
    const query = interaction.options.getString("query", true);
    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel as VoiceChannel;

    if (!voiceChannel) {
      return void interaction.reply({ embeds: [createErrorEmbed(t("common.notInVoice", lang))], ephemeral: true });
    }

    await interaction.deferReply();

    const results = await searchMultiple(query, 10);
    if (!results || results.length === 0) {
      return void interaction.editReply({
        embeds: [createErrorEmbed(t("search.noResults", lang, { query }))],
      });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("search_select")
      .setPlaceholder(t("search.select", lang))
      .addOptions(
        results.slice(0, 10).map((r, i) => {
          const dur = r.durationInSec
            ? `${Math.floor(r.durationInSec / 60)}:${String(r.durationInSec % 60).padStart(2, "0")}`
            : "?:??";
          return new StringSelectMenuOptionBuilder()
            .setLabel(truncate(r.title || "Unknown", 100))
            .setDescription(`${r.channel?.name || "Unknown"} • ${dur}`)
            .setValue(i.toString());
        })
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
    const embed = createSearchEmbed(results, lang);
    const reply = await interaction.editReply({ embeds: [embed], components: [row] });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 30_000,
      filter: (i) => i.user.id === interaction.user.id,
    });

    collector.on("select", async (selectInteraction) => {
      const idx = parseInt(selectInteraction.values[0]);
      const chosen = results[idx];

      const track = new Track({
        title: chosen.title || "Unknown",
        artist: chosen.channel?.name || "Unknown",
        album: "",
        duration: (chosen.durationInSec || 0) * 1000,
        url: chosen.url,
        thumbnail: chosen.thumbnails?.[0]?.url || "",
        source: "search",
        requestedBy: member.user.username,
        requestedById: member.user.id,
        youtubeId: chosen.id,
      });

      let player = playerManager.get(interaction.guildId!);
      if (!player || player.isDestroyed()) {
        player = await playerManager.create(interaction.guildId!, voiceChannel, interaction.channel as TextChannel);
      }

      await player.play(track);
      collector.stop("selected");

      const isFirst = player.queue.all.length === 1;
      if (isFirst) {
        const npEmbed = createNowPlayingEmbed(track, player.queue, lang);
        await selectInteraction.update({ embeds: [npEmbed], components: [] });
      } else {
        await selectInteraction.update({
          embeds: [createSuccessEmbed(t("play.added", lang, { title: track.title }))],
          components: [],
        });
      }
    });

    collector.on("end", async (_, reason) => {
      if (reason !== "selected") {
        await interaction.editReply({ components: [] }).catch(() => {});
      }
    });
  },
};
