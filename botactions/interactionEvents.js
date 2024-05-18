const { saveAnnouncementToDatabase } = require('./scheduleHandler');
const { createChannelSelectMenu } = require('./channelSelector');
const moment = require('moment');

let pendingChannelSelection = {};

module.exports = {
    handleInteraction: async function(interaction, client) {
        if (interaction.isCommand()) {
            await handleCommand(interaction, client);
        } else if (interaction.isButton()) {
            await handleButton(interaction, client);
        } else if (interaction.isStringSelectMenu()) {
            await handleSelectMenu(interaction, client);
        } else if (interaction.isModalSubmit()) {
            await handleModalSubmit(interaction, client);
        } else {
            console.log('Received an unsupported interaction type.');
        }
    }
};

async function handleCommand(interaction, client) {
    const command = client.commands.get(interaction.commandName);
    let message = `${interaction.user.username} used command **${interaction.commandName}**`;
    if (interaction.options._hoistedOptions[0]) {
        message += ` with options **${interaction.options._hoistedOptions[0].value}**`;
    }
    client.channels.cache.get(client.chanBotLog).send(message);

    // Check if the command requires specific roles
    if (command && command.roles) {
        const hasRole = interaction.member.roles.cache.some(role => command.roles.includes(role.name));
        if (!hasRole) {
            await interaction.reply({
                content: "You don't have the required role to use this command.",
                ephemeral: true
            });
            return;
        }
    }

    if (!command) {
        await interaction.reply('Unable to find command...');
        return;
    }

    try {
        if (typeof command.execute === 'function') {
            await command.execute(interaction, client);
        } else {
            command(interaction);
        }
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'There was an error while executing this command!',
            ephemeral: true
        });
    }
}


async function handleButton(interaction, client) {
    const command = client.commands.get(interaction.message.interaction.commandName);
    const message = `${interaction.user.username} clicked button **${interaction.customId}** for command **${interaction.message.interaction.commandName}**`;
    client.channels.cache.get(client.chanBotLog).send(message);

    if (command && command.button) {
        await command.button(interaction, client);
    } else {
        console.error('Button handler not found.');
    }
}

async function handleSelectMenu(interaction, client) {
    const selectedChannelId = interaction.values[0];
    const selectedChannel = await interaction.guild.channels.fetch(selectedChannelId);
    const userSelection = pendingChannelSelection[interaction.user.id];
  
    if (userSelection) {
      const embedData = {
        title: userSelection.title,
        description: userSelection.description,
        author: userSelection.author
      };
      const time = userSelection.time;
  
      // Ensure time is formatted correctly
      const formattedTime = moment(time, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
  
      await saveAnnouncementToDatabase(selectedChannelId, interaction.guild.id, embedData, formattedTime);
  
      await interaction.update({ content: `Announcement scheduled for ${formattedTime} in channel ${selectedChannel.name}`, components: [] });
  
      delete pendingChannelSelection[interaction.user.id];
    } else {
      const command = client.commands.get(interaction.message.interaction.commandName);
      const message = `${interaction.user.username} selected option **${interaction.values[0]}** for command **${interaction.message.interaction.commandName}**`;
      client.channels.cache.get(client.chanBotLog).send(message);
  
      if (command && command.option) {
        await command.option(interaction, client);
      } else {
        console.error('Select menu handler not found.');
      }
    }
  }

async function handleModalSubmit(interaction, client) {
    if (interaction.customId === 'scheduleModal') {
        const title = interaction.fields.getTextInputValue('title');
        const description = interaction.fields.getTextInputValue('description');
        const author = 'PFC Quartermaster';
        const time = interaction.fields.getTextInputValue('time');

        // Validate the time format
        if (!moment(time, 'YYYY-MM-DD HH:mm:ss', true).isValid()) {
            await interaction.reply({ content: 'Invalid time format. Please use YYYY-MM-DD HH:mm:ss', ephemeral: true });
            return;
        }

        // Store the pending data to use after channel selection
        pendingChannelSelection[interaction.user.id] = { title, description, author, time };

        // Create and send the select menu for channel selection
        const selectMenu = await createChannelSelectMenu(interaction.guild);
        await interaction.reply({ content: 'Please select a channel:', components: [selectMenu], ephemeral: true });
    }
}
