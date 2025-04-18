const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, ComponentType } = require('discord.js');
const { Vehicle, VehicleDetail } = require('../config/database');
const { fetchSCDataByUrl } = require('../utils/fetchSCData');
const { Op } = require('sequelize');
const { isUserVerified } = require('../utils/verifyGuard');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shipdetails')
    .setDescription('Fetch and show detailed ship data')
    .addStringOption(option =>
      option.setName('ship')
        .setDescription('Ship name or UUID')
        .setRequired(true)
    ),
  help: 'Fetches and displays detailed data about any ship from Star Citizen, including speed, cargo, emissions, and more.',
  category: 'Star Citizen',
  
  async execute(interaction) {

    if (!(await isUserVerified(interaction.user.id))) {
      return interaction.reply({
        content: '❌ You must verify your RSI profile using `/verify` before using this command.',
        ephemeral: true
      });
    }
    
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
        .setCustomId('shipdetails_select')
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
          
            length: parsed.sizes?.length === 0 ? null : parsed.sizes?.length,
            beam: parsed.sizes?.beam === 0 ? null : parsed.sizes?.beam,
            height: parsed.sizes?.height === 0 ? null : parsed.sizes?.height,
          
            ir_emission: parsed.emission?.ir === 0 ? null : parsed.emission?.ir,
            em_idle: parsed.emission?.em_idle === 0 ? null : parsed.emission?.em_idle,
            em_max: parsed.emission?.em_max === 0 ? null : parsed.emission?.em_max,
          
            mass: parsed.mass === 0 ? null : parsed.mass,
            cargo_capacity: parsed.cargo_capacity ?? null,
            vehicle_inventory: parsed.vehicle_inventory ?? null,
            personal_inventory: parsed.personal_inventory ?? null,
          
            crew_min: parsed.crew?.min === 0 ? null : parsed.crew?.min,
            crew_max: parsed.crew?.max === 0 ? null : parsed.crew?.max,
            crew_weapon: parsed.crew?.weapon === 0 ? null : parsed.crew?.weapon,
            crew_operation: parsed.crew?.operation === 0 ? null : parsed.crew?.operation,
          
            health: parsed.health === 0 ? null : parsed.health,
            shield_hp: parsed.shield_hp === 0 ? null : parsed.shield_hp,
          
            speed_scm: parsed.speed?.scm === 0 ? null : parsed.speed?.scm,
            speed_max: parsed.speed?.max === 0 ? null : parsed.speed?.max,
            speed_zero_to_scm: parsed.speed?.zero_to_scm === 0 ? null : parsed.speed?.zero_to_scm,
            speed_zero_to_max: parsed.speed?.zero_to_max === 0 ? null : parsed.speed?.zero_to_max,
            speed_scm_to_zero: parsed.speed?.scm_to_zero === 0 ? null : parsed.speed?.scm_to_zero,
            speed_max_to_zero: parsed.speed?.max_to_zero === 0 ? null : parsed.speed?.max_to_zero,
          
            fuel_capacity: parsed.fuel?.capacity === 0 ? null : parsed.fuel?.capacity,
            fuel_intake_rate: parsed.fuel?.intake_rate === 0 ? null : parsed.fuel?.intake_rate,
            fuel_usage_main: parsed.fuel?.usage?.main === 0 ? null : parsed.fuel?.usage?.main,
            fuel_usage_maneuvering: parsed.fuel?.usage?.maneuvering === 0 ? null : parsed.fuel?.usage?.maneuvering,
            fuel_usage_retro: parsed.fuel?.usage?.retro === 0 ? null : parsed.fuel?.usage?.retro,
            fuel_usage_vtol: parsed.fuel?.usage?.vtol === 0 ? null : parsed.fuel?.usage?.vtol,
          
            quantum_speed: parsed.quantum?.quantum_speed === 0 ? null : parsed.quantum?.quantum_speed,
            quantum_spool_time: parsed.quantum?.quantum_spool_time === 0 ? null : parsed.quantum?.quantum_spool_time,
            quantum_fuel_capacity: parsed.quantum?.quantum_fuel_capacity === 0 ? null : parsed.quantum?.quantum_fuel_capacity,
            quantum_range: parsed.quantum?.quantum_range === 0 ? null : parsed.quantum?.quantum_range,
          
            agility_pitch: parsed.agility?.pitch === 0 ? null : parsed.agility?.pitch,
            agility_yaw: parsed.agility?.yaw === 0 ? null : parsed.agility?.yaw,
            agility_roll: parsed.agility?.roll === 0 ? null : parsed.agility?.roll,
            agility_acceleration_main: parsed.agility?.acceleration?.main === 0 ? null : parsed.agility?.acceleration?.main,
            agility_acceleration_retro: parsed.agility?.acceleration?.retro === 0 ? null : parsed.agility?.acceleration?.retro,
            agility_acceleration_vtol: parsed.agility?.acceleration?.vtol === 0 ? null : parsed.agility?.acceleration?.vtol,
            agility_acceleration_maneuvering: parsed.agility?.acceleration?.maneuvering === 0 ? null : parsed.agility?.acceleration?.maneuvering,
            agility_main_g: parsed.agility?.acceleration?.main_g === 0 ? null : parsed.agility?.acceleration?.main_g,
            agility_retro_g: parsed.agility?.acceleration?.retro_g === 0 ? null : parsed.agility?.acceleration?.retro_g,
            agility_vtol_g: parsed.agility?.acceleration?.vtol_g === 0 ? null : parsed.agility?.acceleration?.vtol_g,
            agility_maneuvering_g: parsed.agility?.acceleration?.maneuvering_g === 0 ? null : parsed.agility?.acceleration?.maneuvering_g,
          
            armor_ir: parsed.armor?.signal_infrared === 0 ? null : parsed.armor?.signal_infrared,
            armor_em: parsed.armor?.signal_electromagnetic === 0 ? null : parsed.armor?.signal_electromagnetic,
            armor_cross_section: parsed.armor?.signal_cross_section === 0 ? null : parsed.armor?.signal_cross_section,
            armor_physical: parsed.armor?.damage_physical === 0 ? null : parsed.armor?.damage_physical,
            armor_energy: parsed.armor?.damage_energy === 0 ? null : parsed.armor?.damage_energy,
            armor_distortion: parsed.armor?.damage_distortion === 0 ? null : parsed.armor?.damage_distortion,
            armor_thermal: parsed.armor?.damage_thermal === 0 ? null : parsed.armor?.damage_thermal,
            armor_biochemical: parsed.armor?.damage_biochemical === 0 ? null : parsed.armor?.damage_biochemical,
            armor_stun: parsed.armor?.damage_stun === 0 ? null : parsed.armor?.damage_stun,
          
            focus: parsed.foci?.[0]?.en_EN ?? null,
            type: parsed.type?.en_EN ?? null,
            description: parsed.description?.en_EN ?? null,
          
            size_class: parsed.size_class === 0 ? null : parsed.size_class,
            manufacturer_name: parsed.manufacturer?.name ?? null,
            manufacturer_code: parsed.manufacturer?.code ?? null,
          
            insurance_claim_time: parsed.insurance?.claim_time === 0 ? null : parsed.insurance?.claim_time,
            insurance_expedite_time: parsed.insurance?.expedite_time === 0 ? null : parsed.insurance?.expedite_time,
            insurance_expedite_cost: parsed.insurance?.expedite_cost === 0 ? null : parsed.insurance?.expedite_cost,
          
            production_status: parsed.production_status?.en_EN ?? null,
            production_note: parsed.production_note?.en_EN ?? null,
            size: parsed.size?.en_EN ?? null,
          
            msrp: parsed.msrp === 0 ? null : parsed.msrp,
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
        { name: 'Class', value: detail.name || 'N/A', inline: true },
        { name: 'Type', value: detail.type || 'N/A', inline: true },
        { name: 'Manufacturer', value: detail.manufacturer_name || 'N/A', inline: true },
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
