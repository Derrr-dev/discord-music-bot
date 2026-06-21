import {
  Interaction,
  ChatInputCommandInteraction,
  GuildMember,
  ButtonInteraction,
  TextChannel,
  VoiceChannel,
} from "discord.js";
import { BotClient } from "../types";
import { playerManager } from "../music/PlayerManager";
import { createErrorEmbed, createNowPlayingEmbed, createQueueEmbed, createMusicControls } from "../utils/embeds";
import { db } from "../database/Database";
import { t } from "../utils/i18n";

export const name = "interactionCreate";
export const once = false;

export async function execute(interaction: Interaction, client: BotClient) {
  if (interaction.isChatInputCommand()) {
    await handleCommand(interaction, client);
  } else if (interaction.isButton()) {
    await handleButton(interaction, client);
  }
}

async function handleCommand(interaction: ChatInputCommandInteraction, client: BotClient) {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  const settings = db.getGuildSettings(interaction.guildId!);
  const lang = settings.language;
  const member = interaction.member as GuildMember;

  if (command.adminOnly) {
    const hasAdmin = member.permissions.has("ManageGuild") || member.permissions.has("Administrator");
    if (!hasAdmin) {
      return void interaction.reply({
        embeds: [createErrorEmbed(t("common.noPermission", lang))],
        ephemeral: true,
      });
    }
  }

  if (command.djOnly) {
    const djRoleId = settings.djRoleId;
    const hasDj = djRoleId
      ? member.roles.cache.has(djRoleId)
      : member.permissions.has("ManageChannels");
    const hasAdmin = member.permissions.has("Administrator") || member.permissions.has("ManageGuild");

    if (!hasDj && !hasAdmin) {
      return void interaction.reply({
        embeds: [createErrorEmbed(t("common.djOnly", lang))],
        ephemeral: true,
      });
    }
  }

  if (command.voiceRequired) {
    if (!member.voice.channel) {
      return void interaction.reply({
        embeds: [createErrorEmbed(t("common.notInVoice", lang))],
        ephemeral: true,
      });
    }

    const player = playerManager.get(interaction.guildId!);
    if (player && !player.isDestroyed()) {
      if (member.voice.channel.id !== player.getVoiceChannel().id) {
        return void interaction.reply({
          embeds: [createErrorEmbed(t("common.notSameVoice", lang))],
          ephemeral: true,
        });
      }
    }
  }

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);
    const reply = {
      embeds: [createErrorEmbed(t("common.error", lang))],
      ephemeral: true,
    };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
}

async function handleButton(interaction: ButtonInteraction, client: BotClient) {
  const settings = db.getGuildSettings(interaction.guildId!);
  const lang = settings.language;
  const player = playerManager.get(interaction.guildId!);
  const member = interaction.member as GuildMember;

  if (!player || !player.queue.current) {
    return void interaction.reply({ embeds: [createErrorEmbed(t("common.noPlayer", lang))], ephemeral: true });
  }

  if (member.voice.channel?.id !== player.getVoiceChannel().id) {
    return void interaction.reply({ embeds: [createErrorEmbed(t("common.notSameVoice", lang))], ephemeral: true });
  }

  switch (interaction.customId) {
    case "music_pause_resume": {
      if (player.isPlaying()) {
        player.pause();
      } else {
        player.resume();
      }
      const progress = player.getProgress();
      const embed = createNowPlayingEmbed(player.queue.current, player.queue, lang, progress);
      const controls = createMusicControls();
      await interaction.update({ embeds: [embed], components: [controls] });
      break;
    }
    case "music_skip": {
      await player.skip();
      if (player.queue.current) {
        const embed = createNowPlayingEmbed(player.queue.current, player.queue, lang);
        const controls = createMusicControls();
        await interaction.update({ embeds: [embed], components: [controls] });
      } else {
        await interaction.update({ embeds: [createErrorEmbed(t("skip.noNext", lang))], components: [] });
      }
      break;
    }
    case "music_previous": {
      const prev = await player.previous();
      if (prev) {
        const embed = createNowPlayingEmbed(prev, player.queue, lang);
        const controls = createMusicControls();
        await interaction.update({ embeds: [embed], components: [controls] });
      } else {
        await interaction.reply({ embeds: [createErrorEmbed(t("previous.noPrevious", lang))], ephemeral: true });
      }
      break;
    }
    case "music_stop": {
      player.stop();
      playerManager.destroy(interaction.guildId!);
      await interaction.update({ embeds: [createErrorEmbed(t("stop.success", lang))], components: [] });
      break;
    }
    case "music_queue": {
      const embed = createQueueEmbed(player.queue, lang);
      await interaction.reply({ embeds: [embed], ephemeral: true });
      break;
    }
  }
}
