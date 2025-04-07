const { SlashCommandBuilder } = require('discord.js');
const { Vehicle, VehicleDetail } = require('../config/database');
const { fetchSCDataByUrl } = require('../utils/fetchSCData');

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
        [interaction.client.Sequelize.Op.or]: [
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
        const { data: parsed } = await fetchSCDataByUrl(vehicle.link);

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
          ir: parsed.emission?.ir ?? null,
          em_idle: parsed.emission?.em_idle ?? null,
          em_max: parsed.emission?.em_max ?? null,
          vehicle_inventory: parsed.vehicle_inventory ?? null,
          personal_inventory: parsed.personal_inventory ?? null,
          speed_scm: parsed.speed?.scm ?? null,
          speed_max: parsed.speed?.max ?? null,
          pitch: parsed.agility?.pitch ?? null,
          yaw: parsed.agility?.yaw ?? null,
          roll: parsed.agility?.roll ?? null,
          quantum_speed: parsed.quantum?.quantum_speed ?? null,
          quantum_spool_time: parsed.quantum?.quantum_spool_time ?? null,
          quantum_fuel_capacity: parsed.quantum?.quantum_fuel_capacity ?? null,
          quantum_range: parsed.quantum?.quantum_range ?? null,
          armor_physical: parsed.armor?.damage_physical ?? null,
          armor_energy: parsed.armor?.damage_energy ?? null,
          armor_distortion: parsed.armor?.damage_distortion ?? null,
          manufacturer: parsed.manufacturer?.name ?? null,
          type: parsed.type?.en_EN ?? null,
          focus: parsed.foci?.[0]?.en_EN ?? null,
          size: parsed.size?.en_EN ?? null,
          production_status: parsed.production_status?.en_EN ?? null,
          production_note: parsed.production_note?.en_EN ?? null,
          msrp: parsed.msrp ?? null,
          pledge_url: parsed.pledge_url ?? null,
          updated_at: parsed.updated_at,
          version: parsed.version,
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
      url: detail.pledge_url || null,
      description: `Detailed info for **${detail.name}** (${detail.focus || '—'})`,
      fields: [
        { name: 'Class', value: detail.class_name || '—', inline: true },
        { name: 'Size', value: detail.size || '—', inline: true },
        { name: 'Manufacturer', value: detail.manufacturer || '—', inline: true },
        { name: 'Production', value: detail.production_status || '—', inline: true },
        { name: 'Cargo (SCU)', value: `${detail.cargo_capacity || 0}`, inline: true },
        { name: 'Inventory', value: `${detail.vehicle_inventory || 0}K`, inline: true },
        { name: 'Crew (Min–Max)', value: `${detail.crew_min || 0}–${detail.crew_max || '—'}`, inline: true },
        { name: 'Shields (HP)', value: `${detail.shield_hp || 0}`, inline: true },
        { name: 'Speed (SCM/Max)', value: `${detail.speed_scm || 0}/${detail.speed_max || 0}`, inline: true },
        { name: 'Agility (P/Y/R)', value: `${detail.pitch || 0}/${detail.yaw || 0}/${detail.roll || 0}`, inline: true },
        { name: 'Quantum Speed', value: `${detail.quantum_speed || 0}`, inline: true },
        { name: 'Armor (P/E/D)', value: `${detail.armor_physical}/${detail.armor_energy}/${detail.armor_distortion}`, inline: true },
        { name: 'MSRP (USD)', value: `$${detail.msrp || 0}`, inline: true },
        { name: 'Version', value: detail.version || '—', inline: true }
      ],
      timestamp: new Date(detail.updated_at).toISOString()
    };

    await interaction.editReply({ embeds: [embed] });
  }
};
