// commands/galactapedia.js
const {
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    ActionRowBuilder,
    ComponentType,
  } = require('discord.js');
  const { Op } = require('sequelize');
  const { GalactapediaEntry, GalactapediaDetail } = require('../config/database');
  const { fetchSCDataByUrl } = require('../utils/fetchSCData');
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName('galactapedia')
      .setDescription('Search for a Galactapedia entry')
      .addStringOption(option =>
        option.setName('query')
          .setDescription('Search term (name or partial match)')
          .setRequired(true)
      ),
  
    async execute(interaction) {
      const query = interaction.options.getString('query');
      await interaction.deferReply();
  
      let entry = await GalactapediaEntry.findOne({
        where: {
          [Op.or]: [
            { id: query },
            { slug: query },
            { title: query }
          ]
        }
      });
  
      if (!entry) {
        const matches = await GalactapediaEntry.findAll({
          where: {
            title: {
              [Op.like]: `%${query}%`
            }
          },
          limit: 25
        });
  
        if (!matches.length) {
          return interaction.editReply(`❌ No Galactapedia entries found for "${query}".`);
        }
  
        const select = new StringSelectMenuBuilder()
          .setCustomId('select-galactapedia')
          .setPlaceholder('Select an entry')
          .addOptions(matches.map(match => ({
            label: match.title.slice(0, 100),
            description: match.slug,
            value: match.id
          })));
  
        const row = new ActionRowBuilder().addComponents(select);
  
        await interaction.editReply({
          content: 'Multiple entries found. Please choose one:',
          components: [row]
        });
  
        try {
          const selected = await interaction.channel.awaitMessageComponent({
            componentType: ComponentType.StringSelect,
            time: 15000
          });
  
          await selected.deferUpdate();
          entry = await GalactapediaEntry.findByPk(selected.values[0]);
        } catch (err) {
          console.error('[GALACTAPEDIA] Selection error:', err);
          return interaction.editReply({ content: '❌ Selection timed out.', components: [] });
        }
      }
  
      // Fetch or refresh detail
      let detail = await GalactapediaDetail.findByPk(entry.id);
      if (!detail) {
        try {
          const response = await fetchSCDataByUrl(entry.rsi_url);
          const html = response?.data?.content;
          const cleaned = html?.replace(/<[^>]*>?/gm, '')?.trim()?.slice(0, 4000);
  
        //   await GalactapediaDetail.upsert({
        //     id: entry.id,
        //     content: cleaned || 'No content found.',
        //     updated_at: new Date()
        //   });
  
          detail = await GalactapediaDetail.findByPk(entry.id);
        } catch (err) {
          console.error('[GALACTAPEDIA] Failed to fetch detail:', err);
          return interaction.editReply('❌ Failed to fetch Galactapedia detail.');
        }
      }
  
      const embed = {
        color: 0x3399ff,
        title: entry.title,
        url: entry.rsi_url,
        description: detail.content || 'No description available.',
        thumbnail: entry.thumbnail ? { url: entry.thumbnail } : undefined,
        footer: {
          text: entry.type || 'Entry',
        },
        timestamp: new Date().toISOString()
      };
  
      await interaction.editReply({ embeds: [embed], components: [] });
    }
  };
  