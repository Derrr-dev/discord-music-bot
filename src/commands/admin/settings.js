const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { createSuccessEmbed, createErrorEmbed } = require("../../utils/embeds");
const { db } = require("../../database/Database");
const { t, supportedLanguages, isValidLanguage } = require("../../utils/i18n");

const command = {
  data: new SlashCommandBuilder()
    .setName("settings")
    .setDescription("Pengaturan bot server / Bot server settings")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("view").setDescription("Lihat pengaturan saat ini"))
    .addSubcommand(s => s.setName("language").setDescription("Ubah bahasa bot")
      .addStringOption(o => o.setName("lang").setDescription("Bahasa").setRequired(true)
        .addChoices({ name: "Indonesian (Bahasa Indonesia)", value: "id" }, { name: "English", value: "en" })))
    .addSubcommand(s => s.setName("djrole").setDescription("Atur peran DJ")
      .addRoleOption(o => o.setName("role").setDescription("Peran DJ (kosongkan untuk hapus)")))
    .addSubcommand(s => s.setName("volume").setDescription("Atur volume default")
      .addIntegerOption(o => o.setName("level").setDescription("Volume (1-100)").setRequired(true).setMinValue(1).setMaxValue(100)))
    .addSubcommand(s => s.setName("announce").setDescription("Toggle pengumuman lagu")
      .addBooleanOption(o => o.setName("enabled").setDescription("Aktifkan?").setRequired(true)))
    .addSubcommand(s => s.setName("maxqueue").setDescription("Atur batas antrian")
      .addIntegerOption(o => o.setName("size").setDescription("Ukuran maksimal (10-500)").setRequired(true).setMinValue(10).setMaxValue(500))),
  adminOnly: true,

  async execute(interaction) {
    const settings = db.getGuildSettings(interaction.guildId);
    const lang = settings.language;
    const sub = interaction.options.getSubcommand();

    if (sub === "view") {
      const djRole = settings.djRoleId ? interaction.guild?.roles.cache.get(settings.djRoleId)?.name || "Unknown" : "Tidak ada / None";
      return void interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle(t("settings.title", lang))
          .addFields(
            { name: "🌐 Bahasa / Language", value: settings.language === "id" ? "Bahasa Indonesia" : "English", inline: true },
            { name: "🎭 DJ Role", value: djRole, inline: true },
            { name: "🔊 Volume Default", value: `${settings.defaultVolume}%`, inline: true },
            { name: "📢 Umumkan Lagu", value: settings.announceSongs ? "✅ Ya" : "❌ Tidak", inline: true },
            { name: "📋 Maks Antrian", value: `${settings.maxQueueSize} lagu`, inline: true },
          ).setTimestamp()],
      });
    }

    if (sub === "language") {
      const langCode = interaction.options.getString("lang", true);
      if (!isValidLanguage(langCode)) return void interaction.reply({ embeds: [createErrorEmbed("Bahasa tidak valid!")], ephemeral: true });
      db.updateGuildSettings(interaction.guildId, { language: langCode });
      const langName = supportedLanguages.find(l => l.code === langCode)?.name || langCode;
      await interaction.reply({ embeds: [createSuccessEmbed(t("settings.language", langCode, { lang: langName }))] });

    } else if (sub === "djrole") {
      const role = interaction.options.getRole("role");
      db.updateGuildSettings(interaction.guildId, { djRoleId: role?.id || null });
      await interaction.reply({ embeds: [createSuccessEmbed(role ? t("settings.djRole", lang, { role: role.name }) : "DJ role dihapus / DJ role removed")] });

    } else if (sub === "volume") {
      const level = interaction.options.getInteger("level", true);
      db.updateGuildSettings(interaction.guildId, { defaultVolume: level });
      await interaction.reply({ embeds: [createSuccessEmbed(t("settings.volume", lang, { volume: level }))] });

    } else if (sub === "announce") {
      const enabled = interaction.options.getBoolean("enabled", true);
      db.updateGuildSettings(interaction.guildId, { announceSongs: enabled });
      await interaction.reply({ embeds: [createSuccessEmbed(t("settings.announce", lang, { status: enabled ? t("status.on", lang) : t("status.off", lang) }))] });

    } else if (sub === "maxqueue") {
      const size = interaction.options.getInteger("size", true);
      db.updateGuildSettings(interaction.guildId, { maxQueueSize: size });
      await interaction.reply({ embeds: [createSuccessEmbed(t("settings.updated", lang))] });
    }
  },
};
module.exports = { command };
