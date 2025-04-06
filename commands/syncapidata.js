const { SlashCommandBuilder } = require('discord.js');
const { syncManufacturers } = require('../botactions/api/syncEndpoints');
const { isAdmin } = require('../botactions/userManagement/permissions'); // Assuming you have some admin check utility

module.exports = {
  data: new SlashCommandBuilder()
    .setName('syncapidata')
    .setDescription('Sync API data into the database (admin only)'),

  async execute(interaction) {

    if (!(await isAdmin(interaction.member))) {
      return interaction.reply({
        content: '❌ You do not have permission to run this command.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const result = await syncManufacturers();

      const embed = new EmbedBuilder()
      .setTitle('✅ Manufacturer Sync Complete')
      .setColor(0x00ff00)
      .setDescription(`Successfully synced **${result.created}** manufacturers.`)
      .addFields(
        { name: 'Skipped', value: `${result.skipped || 0}`, inline: true },
        { name: 'Total Fetched', value: `${result.created + (result.skipped || 0)}`, inline: true }
      )
      .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[SYNC ERROR]', err);
      await interaction.editReply({
        content: '❌ Something went wrong while syncing manufacturer data.',
        ephemeral: true
      });
    }
  }
};
