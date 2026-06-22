const { playerManager } = require("../music/PlayerManager");
const {
  createErrorEmbed, createNowPlayingEmbed, createQueueEmbed, createMusicControls,
} = require("../utils/embeds");
const { db } = require("../database/Database");
const { t } = require("../utils/i18n");

const name = "interactionCreate";
const once = false;

async function execute(interaction, client) {
  if (interaction.isChatInputCommand()) await _handleCommand(interaction, client);
  else if (interaction.isButton()) await _handleButton(interaction, client);
}

async function _handleCommand(interaction, client) {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  const settings = db.getGuildSettings(interaction.guildId);
  const lang = settings.language;
  const member = interaction.member;

  if (command.adminOnly) {
    const hasAdmin = member.permissions.has("ManageGuild") || member.permissions.has("Administrator");
    if (!hasAdmin) {
      return void interaction.reply({ embeds: [createErrorEmbed(t("common.noPermission", lang))], ephemeral: true });
    }
  }

  if (command.djOnly) {
    const djRoleId = settings.djRoleId;
    const hasDj = djRoleId ? member.roles.cache.has(djRoleId) : member.permissions.has("ManageChannels");
    const hasAdmin = member.permissions.has("Administrator") || member.permissions.has("ManageGuild");
    if (!hasDj && !hasAdmin) {
      return void interaction.reply({ embeds: [createErrorEmbed(t("common.djOnly", lang))], ephemeral: true });
    }
  }

  if (command.voiceRequired) {
    if (!member.voice.channel) {
      return void interaction.reply({ embeds: [createErrorEmbed(t("common.notInVoice", lang))], ephemeral: true });
    }
    const player = playerManager.get(interaction.guildId);
    if (player && !player.isDestroyed()) {
      if (member.voice.channel.id !== player.getVoiceChannel().id) {
        return void interaction.reply({ embeds: [createErrorEmbed(t("common.notSameVoice", lang))], ephemeral: true });
      }
    }
  }

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`Error in /${interaction.commandName}:`, error);
    const reply = { embeds: [createErrorEmbed(t("common.error", lang))], ephemeral: true };
    if (interaction.deferred || interaction.replied) await interaction.editReply(reply).catch(() => {});
    else await interaction.reply(reply).catch(() => {});
  }
}

async function _handleButton(interaction, client) {
  const settings = db.getGuildSettings(interaction.guildId);
  const lang = settings.language;
  const player = playerManager.get(interaction.guildId);
  const member = interaction.member;

  if (!player || !player.queue.current) {
    return void interaction.reply({ embeds: [createErrorEmbed(t("common.noPlayer", lang))], ephemeral: true });
  }
  if (member.voice.channel?.id !== player.getVoiceChannel().id) {
    return void interaction.reply({ embeds: [createErrorEmbed(t("common.notSameVoice", lang))], ephemeral: true });
  }

  switch (interaction.customId) {
    case "music_pause_resume": {
      player.isPlaying() ? player.pause() : player.resume();
      const embed = createNowPlayingEmbed(player.queue.current, player.queue, lang, player.getProgress());
      await interaction.update({ embeds: [embed], components: [createMusicControls()] });
      break;
    }
    case "music_skip": {
      await player.skip();
      if (player.queue.current) {
        await interaction.update({ embeds: [createNowPlayingEmbed(player.queue.current, player.queue, lang)], components: [createMusicControls()] });
      } else {
        await interaction.update({ embeds: [createErrorEmbed(t("skip.noNext", lang))], components: [] });
      }
      break;
    }
    case "music_previous": {
      const prev = await player.previous();
      if (prev) {
        await interaction.update({ embeds: [createNowPlayingEmbed(prev, player.queue, lang)], components: [createMusicControls()] });
      } else {
        await interaction.reply({ embeds: [createErrorEmbed(t("previous.noPrevious", lang))], ephemeral: true });
      }
      break;
    }
    case "music_stop": {
      player.stop();
      playerManager.destroy(interaction.guildId);
      await interaction.update({ embeds: [createSuccessEmbed(t("stop.success", lang))], components: [] });
      break;
    }
    case "music_queue": {
      await interaction.reply({ embeds: [createQueueEmbed(player.queue, lang)], ephemeral: true });
      break;
    }
  }
}

module.exports = { name, once, execute };
