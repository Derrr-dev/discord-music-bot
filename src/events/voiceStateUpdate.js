const { playerManager } = require("../music/PlayerManager");

const name = "voiceStateUpdate";
const once = false;

async function execute(oldState, newState, client) {
  const guildId = oldState.guild.id;
  const player = playerManager.get(guildId);
  if (!player) return;

  const botVoiceChannel = player.getVoiceChannel();
  if (oldState.channelId === botVoiceChannel.id || newState.channelId === botVoiceChannel.id) {
    const ch = oldState.guild.channels.cache.get(botVoiceChannel.id);
    if (!ch?.isVoiceBased()) return;

    const members = ch.members.filter(m => !m.user.bot);
    if (members.size === 0) {
      setTimeout(() => {
        const p = playerManager.get(guildId);
        if (!p) return;
        const currentCh = p.getVoiceChannel();
        const currentMembers = currentCh.members.filter(m => !m.user.bot);
        if (currentMembers.size === 0) playerManager.destroy(guildId);
      }, 60_000);
    }
  }
}

module.exports = { name, once, execute };
