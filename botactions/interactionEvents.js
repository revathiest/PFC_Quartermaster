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
        } else if (interaction.isSelectMenu()) {
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

    if (command && command.role && !interaction.member.roles.cache.has(command.role)) {
        await interaction.reply("You're not authorized to use that command");
        return;
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
    if (interaction.customId === 'selectChannel') {
        const selectedChannelId = interaction.values[0];
        const selectedChannel = interaction.guild.channels.cache.get(selectedChannelId);
        const message = `${interaction.user.username} selected channel **${selectedChannel.name}**`;
        client.channels.cache.get(client.chanBotLog).send(message);

        // Retrieve the pending data for this interaction
        const pendingData = pendingChannelSelection[interaction.user.id];
        if (pendingData) {
            const { title, description, author, time } = pendingData;

            // Save the announcement to the database
            const embedData = { title, description, author };
            await saveAnnouncementToDatabase(selectedChannelId, embedData, time);

            await interaction.update({ content: `Announcement scheduled for ${time} in channel ${selectedChannel.name}`, components: [] });

            // Clean up the pending data
            delete pendingChannelSelection[interaction.user.id];
        } else {
            await interaction.update({ content: `Channel selected: ${selectedChannel.name}`, components: [] });
        }
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
d        const title = interaction.fields.getTextInputValue('title');
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
