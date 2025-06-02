// eventHandling/interactionEvents/handleInteraction.js

const { buildOptionsSummary } = require('./interactionEvents/buildOptionsSummary');
const { logInteraction } = require('./interactionEvents/logInteraction');
const { createChannelSelectMenu } = require('../commandHandling/channelSelector');
const { pendingChannelSelection } = require('../../utils/pendingSelections');
const { MessageFlags } = require('discord.js');
const chrono = require('chrono-node');

function getPrefixFromCustomId(customId) {
  return customId.split('::')[0];
}

async function handleInteraction(interaction, client) {
  if (!interaction) {
    console.error('❌ Interaction is null or undefined');
    return;
  }

  const serverId = interaction.guild?.id ?? 'unknown';

  if (interaction.isCommand()) {
    const optionsSummary = await buildOptionsSummary(interaction);
    await logInteraction({
      interaction,
      type: 'command',
      event: 'command_used',
      commandName: interaction.commandName,
      serverId,
      optionsSummary,
    });

    await handleCommand(interaction, client);

  } else if (interaction.isButton()) {
    let commandName = interaction.message?.interaction?.commandName;

    if (!commandName) {
      const id = interaction.customId;
      const prefix = getPrefixFromCustomId(id);
      const matched = [...client.commands.values()].find(cmd =>
        typeof cmd.button === 'function' && id.startsWith(cmd.data?.name)
      );
      commandName = matched?.data?.name || prefix || 'unknown';
    }

    await logInteraction({
      interaction,
      type: 'button',
      event: 'button_click',
      commandName,
      serverId,
    });

    await handleButton(interaction, client);

  } else if (interaction.isStringSelectMenu()) {
    const id = interaction.customId;
    const prefix = getPrefixFromCustomId(id);
    const matched = [...client.commands.values()].find(cmd =>
      typeof cmd.option === 'function' && id.startsWith(cmd.data?.name)
    );
    const commandName = matched?.data?.name || prefix || 'unknown';
    const selectedValues = interaction.values || [];

    await logInteraction({
      interaction,
      type: 'select_menu',
      event: 'select_menu_select',
      commandName,
      serverId,
      optionsSummary: selectedValues.length ? `selected: [${selectedValues.join(', ')}]` : '',
    });

    await handleSelectMenu(interaction, client);

  } else if (interaction.isModalSubmit()) {
    const commandName = interaction.customId || 'unknown_modal';

    await logInteraction({
      interaction,
      type: 'modal_submit',
      event: 'modal_submit',
      commandName,
      serverId,
    });

    await handleModalSubmit(interaction, client);

  } else {
    console.log('⚠️ Received an unsupported interaction type.');
  }
}

async function handleCommand(interaction, client) {
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    await interaction.reply('❌ Unable to find command...');
    return;
  }

  if (command.roles) {
    const hasRole = interaction.member.roles.cache.some(role => command.roles.includes(role.name));
    if (!hasRole) {
      await interaction.reply({
        content: "You don't have the required role to use this command.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
  }

  try {
    if (typeof command.execute === 'function') {
      await command.execute(interaction, client);
    } else {
      command(interaction);
    }
  } catch (error) {
    console.error('❌ Error executing command:', error);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ There was an error while executing this command!',
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.editReply({
          content: '❌ There was an error while executing this command!',
        });
      }
    } catch (replyError) {
      console.error('❗ Failed to send error message to interaction:', replyError);
    }
  }
}

async function handleButton(interaction, client) {
  try {
    const prefix = getPrefixFromCustomId(interaction.customId);
    const command = [...client.commands.values()].find(cmd =>
      typeof cmd.button === 'function' && cmd.data?.name && interaction.customId.startsWith(cmd.data.name)
    );

    if (command) {
      await command.button(interaction, client);
    } else {
      console.warn(`⚠️ No button handler found for prefix: ${prefix}`);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Button handler not found.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  } catch (err) {
    console.error('❌ [ERROR] handleButton() failed:', err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Something went wrong.', flags: MessageFlags.Ephemeral });
    }
  }
}

async function handleSelectMenu(interaction, client) {
  try {
    const id = interaction.customId;

    const commandsArray = [...client.commands.values()];
    const command = commandsArray.find(cmd => {
      const hasOption = typeof cmd.option === 'function';
      const commandName = cmd.data?.name;
      const idMatches = commandName && id.startsWith(commandName);
      return hasOption && idMatches;
    });

    if (command) {
      console.log(`✅ Select menu matched command "${command.data.name}"`);
      await command.option(interaction, client);
    } else {
      console.warn(`⚠️ No select menu handler matched for customId: ${id}`);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Select menu handler not found.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }

  } catch (err) {
    console.error('❌ [ERROR] handleSelectMenu() failed:', err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Something went wrong.', flags: MessageFlags.Ephemeral });
    }
  }
}

async function handleModalSubmit(interaction, client) {
  try {
    if (interaction.customId === 'scheduleModal') {
      const title = interaction.fields.getTextInputValue('title');
      const description = interaction.fields.getTextInputValue('description');
      const author = 'PFC Quartermaster';
      const time = interaction.fields.getTextInputValue('time');

      const parsedTime = chrono.parseDate(time);
      if (!parsedTime || isNaN(parsedTime)) {
        await interaction.reply({
          content: '❌ Could not understand that time. Try something like "tomorrow at 5pm" or "in 15 minutes".',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const pad = (num) => num.toString().padStart(2, '0');
      const formatDateToLocalSQL = (date) => {
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
          `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      };

      const formattedTime = formatDateToLocalSQL(parsedTime);

      pendingChannelSelection[interaction.user.id] = {
        title,
        description,
        author,
        time: formattedTime,
      };

      const selectMenu = await createChannelSelectMenu(interaction.guild, 'schedule');
      await interaction.reply({
        content: '📢 Please select a channel:',
        components: [selectMenu],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const prefix = getPrefixFromCustomId(interaction.customId);
    const command = [...client.commands.values()].find(cmd =>
      typeof cmd.modal === 'function' && cmd.data?.name && interaction.customId.startsWith(cmd.data.name)
    );

    if (command) {
      await command.modal(interaction, client);
      return;
    }

    console.warn(`⚠️ No modal handler found for prefix "${prefix}".`);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Modal handler not found.', flags: MessageFlags.Ephemeral });
    }
  } catch (err) {
    console.error('❌ [ERROR] handleModalSubmit() failed:', err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Something went wrong.', flags: MessageFlags.Ephemeral });
    }
  }
}

module.exports = {
  handleInteraction,
};
