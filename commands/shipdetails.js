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
        description: `**Class:** ${detail.class_name || 'N/A'}\n**Version:** ${detail.version || 'N/A'}`,
        fields: [
          {
            name: '🛠 Dimensions',
            value: `**L×W×H:** ${detail.length ?? '?'}×${detail.beam ?? '?'}×${detail.height ?? '?'} m`,
            inline: true,
          },
          {
            name: '👥 Crew',
            value: `**Min–Max:** ${detail.crew_min ?? '?'}–${detail.crew_max ?? '?'}`,
            inline: true,
          },
          {
            name: '📦 Cargo',
            value: `**Capacity:** ${detail.cargo_capacity ?? 0} SCU\n**Inventory:** ${detail.vehicle_inventory ?? 0}K μSCU`,
            inline: true,
          },
          {
            name: '🚀 Speed',
            value: `**SCM/Max:** ${detail.speed_scm ?? '?'} / ${detail.speed_max ?? '?'}\n**Q-Drive:** ${detail.quantum_speed ? (detail.quantum_speed / 1_000_000).toFixed(1) : '?'} Mm/s`,
            inline: true,
          },
          {
            name: '🛡 Shield & Armor',
            value: `**Shields:** ${detail.shield_hp ?? '?'}\n**Phys:** ${detail.armor_damage_physical ?? '?'}x | **Energy:** ${detail.armor_damage_energy ?? '?'}x`,
            inline: true,
          },
          {
            name: '📡 Emissions',
            value: `**IR:** ${detail.ir ?? '?'}\n**EM (idle):** ${detail.em_idle ?? '?'}\n**EM (max):** ${detail.em_max ?? '?'}`,
            inline: true,
          },
          {
            name: '⚙️ Agility',
            value: `**Pitch/Yaw/Roll:** ${detail.agility_pitch ?? '?'} / ${detail.agility_yaw ?? '?'} / ${detail.agility_roll ?? '?'}`,
            inline: true,
          },
          {
            name: '🏗 Production',
            value: `**Status:** ${detail.production_status || 'N/A'}\n**MSRP:** ${detail.msrp ? `$${detail.msrp}` : 'N/A'}`,
            inline: true,
          }
        ],
        timestamp: new Date(detail.updated_at).toISOString(),
        footer: {
          text: `Last Updated`
        }
      };
      

    await interaction.editReply({ embeds: [embed] });
  }
};
