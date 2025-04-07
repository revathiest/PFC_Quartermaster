const { SlashCommandBuilder } = require('discord.js');
const { Vehicle, VehicleDetail } = require('../config/database');
const { fetchSCDataByUrl } = require('../utils/fetchSCData'); // We'll create this if you haven't
const { Op } = require('sequelize');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shipdetails')
    .setDescription('Fetch and show detailed ship data')
    .addStringOption(option =>
      option.setName('ship')
        .setDescription('Ship name or UUID')
        .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString('ship');

    await interaction.deferReply();

    const vehicle = await Vehicle.findOne({
      where: {
        [Op.or]: [
          { name: query },
          { uuid: query }
        ]
      }
    });

    if (!vehicle) {
      return interaction.editReply(`❌ No vehicle found matching "${query}"`);
    }

    let detail = await VehicleDetail.findByPk(vehicle.uuid);
    const vehicleUpdated = new Date(vehicle.updated_at);
    const needsUpdate = !detail || new Date(detail.updated_at) < vehicleUpdated;

    if (needsUpdate) {
      console.log(`[SHIPDETAILS] Fetching fresh details for ${vehicle.name}`);

      try {
        const detailData = await fetchSCDataByUrl(vehicle.link); // you'll want to return .data from the response
        const parsed = detailData.data;

        // Upsert the detail data into the DB
        await VehicleDetail.upsert({
          uuid: vehicle.uuid,
          name: parsed.name,
          slug: parsed.slug,
          class_name: parsed.class_name,
          cargo_capacity: parsed.cargo_capacity,
          shield_hp: parsed.shield_hp,
          crew_min: parsed.crew?.min ?? null,
          crew_max: parsed.crew?.max ?? null,
          length: parsed.sizes?.length ?? null,
          beam: parsed.sizes?.beam ?? null,
          height: parsed.sizes?.height ?? null,
          updated_at: parsed.updated_at,
          version: parsed.version
        });

        detail = await VehicleDetail.findByPk(vehicle.uuid);
      } catch (err) {
        console.error('[SHIPDETAILS] Failed to fetch/update detail:', err);
        return interaction.editReply('❌ Failed to fetch or store updated vehicle details.');
      }
    }

    const embed = {
      color: 0x0099ff,
      title: `${detail.name}`,
      description: `Detailed info for **${detail.name}**`,
      fields: [
        { name: 'Class', value: detail.class_name, inline: true },
        { name: 'Size (L×W×H)', value: `${detail.length}×${detail.beam}×${detail.height}m`, inline: true },
        { name: 'Cargo Capacity', value: `${detail.cargo_capacity}`, inline: true },
        { name: 'Crew', value: `${detail.crew_min}–${detail.crew_max}`, inline: true },
        { name: 'Shields', value: `${detail.shield_hp}`, inline: true },
        { name: 'Version', value: detail.version, inline: true },
      ],
      timestamp: new Date(detail.updated_at).toISOString()
    };

    await interaction.editReply({ embeds: [embed] });
  }
};
