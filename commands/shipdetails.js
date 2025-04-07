const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, ComponentType } = require('discord.js');
const { Vehicle, VehicleDetail } = require('../config/database');
const { fetchSCDataByUrl } = require('../utils/fetchSCData');
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

    // Attempt to find exact match or UUID
    let vehicle = await Vehicle.findOne({
      where: {
        name: query
      }
    });

    // If not found, check for UUID
    if (!vehicle) {
      vehicle = await Vehicle.findOne({ where: { uuid: query } });
    }

    // If still not found, try partial match and show select menu
    if (!vehicle) {
      const matches = await Vehicle.findAll({
        where: {
          name: {
            [Op.like]: `%${query}%`
          }
        },
        limit: 25
      });

      if (!matches.length) {
        return interaction.editReply(`❌ No vehicles found matching "${query}"`);
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select-vehicle')
        .setPlaceholder('Select the specific ship you meant')
        .addOptions(matches.map(ship => ({
          label: ship.name,
          description: `Version: ${ship.version}`,
          value: ship.uuid
        })));

      const row = new ActionRowBuilder().addComponents(selectMenu);
      await interaction.editReply({
        content: `Multiple ships found matching "${query}". Please pick one:`,
        components: [row]
      });

      try {
        const selection = await interaction.channel.awaitMessageComponent({
          componentType: ComponentType.StringSelect,
          time: 15000
        });

        await selection.deferUpdate();
        vehicle = await Vehicle.findByPk(selection.values[0]);
      } catch (err) {
        console.warn('[SHIPDETAILS] No selection made or error occurred:', err);
        return interaction.editReply({
          content: '❌ Timed out waiting for ship selection or there was an error.',
          components: []
        });
      }
    }

    if (!vehicle) {
      return interaction.editReply(`❌ Couldn't retrieve vehicle data.`);
    }

    // Check for existing detailed info
    let detail = await VehicleDetail.findByPk(vehicle.uuid);
    const vehicleUpdated = new Date(vehicle.updated_at);
    const needsUpdate = !detail || new Date(detail.updated_at) < vehicleUpdated;

    if (needsUpdate) {
      try {
        const detailData = await fetchSCDataByUrl(vehicle.link);
        const parsed = detailData.data;

        await VehicleDetail.upsert({
          uuid: parsed.uuid,
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
          ir_emission: parsed.emission?.ir ?? null,
          em_idle: parsed.emission?.em_idle ?? null,
          em_max: parsed.emission?.em_max ?? null,
          vehicle_inventory: parsed.vehicle_inventory ?? null,
          personal_inventory: parsed.personal_inventory ?? null,
          speed_scm: parsed.speed?.scm ?? null,
          speed_max: parsed.speed?.max ?? null,
          agility_pitch: parsed.agility?.pitch ?? null,
          agility_yaw: parsed.agility?.yaw ?? null,
          agility_roll: parsed.agility?.roll ?? null,
          quantum_speed: parsed.quantum?.quantum_speed ?? null,
          quantum_range: parsed.quantum?.quantum_range ?? null,
          focus: parsed.foci?.[0]?.en_EN ?? null,
          type: parsed.type?.en_EN ?? null,
          description: parsed.description?.en_EN ?? null,
          manufacturer: parsed.manufacturer?.name ?? null,
          production_status: parsed.production_status?.en_EN ?? null,
          size: parsed.size?.en_EN ?? null,
          version: parsed.version,
          updated_at: parsed.updated_at
        });

        detail = await VehicleDetail.findByPk(vehicle.uuid);
      } catch (err) {
        console.error('[SHIPDETAILS] Failed to fetch/update detail:', err);
        return interaction.editReply('❌ Failed to fetch or store updated vehicle details.');
      }
    }

    const embed = {
      color: 0x0099ff,
      title: `${detail.name} — ${detail.focus || 'Unknown Role'}`,
      description: detail.description || 'No description available.',
      fields: [
        { name: 'Class', value: detail.class_name || 'N/A', inline: true },
        { name: 'Type', value: detail.type || 'N/A', inline: true },
        { name: 'Manufacturer', value: detail.manufacturer || 'N/A', inline: true },
        { name: 'Crew (Min–Max)', value: `${detail.crew_min ?? '?'}–${detail.crew_max ?? '?'}`, inline: true },
        { name: 'Cargo Capacity', value: `${detail.cargo_capacity ?? 0} SCU`, inline: true },
        { name: 'Vehicle Inventory', value: `${detail.vehicle_inventory ?? 0}k µSCU`, inline: true },
        { name: 'Size (L×W×H)', value: `${detail.length}×${detail.beam}×${detail.height}m`, inline: true },
        { name: 'Shields', value: `${detail.shield_hp ?? 'N/A'}`, inline: true },
        { name: 'IR/EM Emissions', value: `${detail.ir_emission}/${detail.em_max}`, inline: true },
        { name: 'Speed (SCM/Max)', value: `${detail.speed_scm}/${detail.speed_max}`, inline: true },
        { name: 'Agility (P/Y/R)', value: `${detail.agility_pitch}/${detail.agility_yaw}/${detail.agility_roll}`, inline: true },
        { name: 'Quantum Speed', value: `${detail.quantum_speed ?? 'N/A'} m/s`, inline: true },
        { name: 'Quantum Range', value: `${detail.quantum_range ?? 'N/A'} m`, inline: true },
        { name: 'Production', value: detail.production_status || 'Unknown', inline: true },
        { name: 'Size Class', value: detail.size || 'Unknown', inline: true },
        { name: 'Version', value: detail.version || 'N/A', inline: true }
      ],
      timestamp: new Date(detail.updated_at).toISOString()
    };

    await interaction.editReply({
      content: `Here’s what I found for "${detail.name}"`,
      embeds: [embed],
      components: []
    });
  }
};
