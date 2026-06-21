import { VoiceState } from "discord.js";
import { BotClient } from "../types";
import { playerManager } from "../music/PlayerManager";

export const name = "voiceStateUpdate";
export const once = false;

export async function execute(oldState: VoiceState, newState: VoiceState, client: BotClient) {
  const guildId = oldState.guild.id;
  const player = playerManager.get(guildId);
  if (!player) return;

  const botVoiceChannel = player.getVoiceChannel();

  if (oldState.channelId === botVoiceChannel.id || newState.channelId === botVoiceChannel.id) {
    const voiceChannel = oldState.guild.channels.cache.get(botVoiceChannel.id);
    if (!voiceChannel?.isVoiceBased()) return;

    const membersInChannel = voiceChannel.members.filter((m) => !m.user.bot);

    if (membersInChannel.size === 0) {
      setTimeout(() => {
        const currentPlayer = playerManager.get(guildId);
        if (!currentPlayer) return;

        const currentChannel = currentPlayer.getVoiceChannel();
        const currentMembers = currentChannel.members.filter((m) => !m.user.bot);

        if (currentMembers.size === 0) {
          playerManager.destroy(guildId);
        }
      }, 60_000);
    }
  }
}
