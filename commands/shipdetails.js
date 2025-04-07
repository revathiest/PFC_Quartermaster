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

        if (!parsed.uuid) {
          console.warn(`[SHIPDETAILS] API data missing uuid for "${parsed.name}", falling back to vehicle.uuid`);
        }

        await VehicleDetail.upsert({
            uuid: parsed.uuid || vehicle.uuid,
            name: parsed.name,
            slug: parsed.slug,
            class_name: parsed.class_name,
            length: parsed.sizes?.length ?? null,
            beam: parsed.sizes?.beam ?? null,
            height: parsed.sizes?.height ?? null,
          
            ir_emission: parsed.emission?.ir ?? null,
            em_idle: parsed.emission?.em_idle ?? null,
            em_max: parsed.emission?.em_max ?? null,
          
            mass: parsed.mass ?? null,
            cargo_capacity: parsed.cargo_capacity ?? null,
            vehicle_inventory: parsed.vehicle_inventory ?? null,
            personal_inventory: parsed.personal_inventory ?? null,
          
            crew_min: parsed.crew?.min ?? null,
            crew_max: parsed.crew?.max ?? null,
            crew_weapon: parsed.crew?.weapon ?? null,
            crew_operation: parsed.crew?.operation ?? null,
          
            health: parsed.health ?? null,
            shield_hp: parsed.shield_hp ?? null,
          
            speed_scm: parsed.speed?.scm ?? null,
            speed_max: parsed.speed?.max ?? null,
            speed_zero_to_scm: parsed.speed?.zero_to_scm ?? null,
            speed_zero_to_max: parsed.speed?.zero_to_max ?? null,
            speed_scm_to_zero: parsed.speed?.scm_to_zero ?? null,
            speed_max_to_zero: parsed.speed?.max_to_zero ?? null,
          
            fuel_capacity: parsed.fuel?.capacity ?? null,
            fuel_intake_rate: parsed.fuel?.intake_rate ?? null,
            fuel_usage_main: parsed.fuel?.usage?.main ?? null,
            fuel_usage_maneuvering: parsed.fuel?.usage?.maneuvering ?? null,
            fuel_usage_retro: parsed.fuel?.usage?.retro ?? null,
            fuel_usage_vtol: parsed.fuel?.usage?.vtol ?? null,
          
            quantum_speed: parsed.quantum?.quantum_speed ?? null,
            quantum_spool_time: parsed.quantum?.quantum_spool_time ?? null,
            quantum_fuel_capacity: parsed.quantum?.quantum_fuel_capacity ?? null,
            quantum_range: parsed.quantum?.quantum_range ?? null,
          
            agility_pitch: parsed.agility?.pitch ?? null,
            agility_yaw: parsed.agility?.yaw ?? null,
            agility_roll: parsed.agility?.roll ?? null,
            agility_acceleration_main: parsed.agility?.acceleration?.main ?? null,
            agility_acceleration_retro: parsed.agility?.acceleration?.retro ?? null,
            agility_acceleration_vtol: parsed.agility?.acceleration?.vtol ?? null,
            agility_acceleration_maneuvering: parsed.agility?.acceleration?.maneuvering ?? null,
            agility_main_g: parsed.agility?.acceleration?.main_g ?? null,
            agility_retro_g: parsed.agility?.acceleration?.retro_g ?? null,
            agility_vtol_g: parsed.agility?.acceleration?.vtol_g ?? null,
            agility_maneuvering_g: parsed.agility?.acceleration?.maneuvering_g ?? null,
          
            armor_ir: parsed.armor?.signal_infrared ?? null,
            armor_em: parsed.armor?.signal_electromagnetic ?? null,
            armor_cross_section: parsed.armor?.signal_cross_section ?? null,
            armor_physical: parsed.armor?.damage_physical ?? null,
            armor_energy: parsed.armor?.damage_energy ?? null,
            armor_distortion: parsed.armor?.damage_distortion ?? null,
            armor_thermal: parsed.armor?.damage_thermal ?? null,
            armor_biochemical: parsed.armor?.damage_biochemical ?? null,
            armor_stun: parsed.armor?.damage_stun ?? null,
          
            focus: parsed.foci?.[0]?.en_EN ?? null,
            type: parsed.type?.en_EN ?? null,
            description: parsed.description?.en_EN ?? null,
          
            size_class: parsed.size_class ?? null,
            manufacturer_name: parsed.manufacturer?.name ?? null,
            manufacturer_code: parsed.manufacturer?.code ?? null,
          
            insurance_claim_time: parsed.insurance?.claim_time ?? null,
            insurance_expedite_time: parsed.insurance?.expedite_time ?? null,
            insurance_expedite_cost: parsed.insurance?.expedite_cost ?? null,
          
            production_status: parsed.production_status?.en_EN ?? null,
            production_note: parsed.production_note?.en_EN ?? null,
            size: parsed.size?.en_EN ?? null,
          
            msrp: parsed.msrp ?? null,
            pledge_url: parsed.pledge_url ?? null,
          
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
