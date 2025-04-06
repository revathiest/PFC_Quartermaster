const { SlashCommandBuilder } = require('discord.js');
const { fetchSCData } = require('../utils/fetchSCData');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('testfetch')
    .setDescription('Fetch data from the Star Citizen API')
    .addStringOption(option =>
      option.setName('endpoint')
        .setDescription('The API endpoint to fetch')
        .setRequired(true)
        .addChoices(
          { name: 'Armor', value: 'armor' },
          { name: 'Clothes', value: 'clothes' },
          { name: 'Weapons', value: 'weapons' },
          { name: 'Factions', value: 'factions' },
          { name: 'Food', value: 'food' },
          { name: 'Items', value: 'items' },
          { name: 'Manufacturers', value: 'manufacturers' },
          { name: 'Missions', value: 'missions' },
          { name: 'Mission Givers', value: 'mission-givers' },
          { name: 'Shops', value: 'shops' },
          { name: 'Vehicles', value: 'vehicles' },
          { name: 'Vehicle Items', value: 'vehicle-items' },
          { name: 'Vehicle Weapons', value: 'vehicle-weapons' }
        )),
  
  async execute(interaction) {
    const endpoint = interaction.options.getString('endpoint');

    await interaction.deferReply();

    try {
      const result = await fetchSCData(endpoint);
      const count = result?.data?.length || 0;
      await interaction.editReply(`Fetched \`${count}\` results from \`${endpoint}\`.`);
    } catch (err) {
      console.error('[TESTFETCH] Error:', err);
      await interaction.editReply(`❌ Error fetching from \`${endpoint}\`: ${err.message}`);
    }
  }
};
