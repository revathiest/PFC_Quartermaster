const { saveAnnouncementToDatabase } = require('../scheduling/scheduleHandler');
const { createChannelSelectMenu } = require('../commandHandling/channelSelector');
const moment = require('moment');
const { UsageLog } = require('../../config/database');

let pendingChannelSelection = {};


async function handleInteraction(interaction, client) {

    if (!interaction){
        console.error('Interaction is null or undefined');
        return;
    }

    const serverId = interaction.guild.id; // Get the server ID

    if (interaction.isCommand()) {
        try {
            // Log the command usage to the database
            await UsageLog.create({
                user_id: interaction.user.id,
                interaction_type: 'command',
                event_type: 'command_used',
                command_name: interaction.commandName,
                message_id: interaction.message.id,
                channel_id: interaction.channel.id,
                server_id: serverId,
                event_time: new Date(),
            });
            console.log('Command usage logged successfully');
        } catch (error) {
            console.error('Error logging command usage:', error);
        }

        await handleCommand(interaction, client);
    } else if (interaction.isButton()) {
        try {
            // Log the button interaction to the database
            await UsageLog.create({
                user_id: interaction.user.id,
                interaction_type: 'button',
                event_type: 'button_click',
                command_name: interaction.message.interaction.commandName,
                channel_id: interaction.channel.id,
                server_id: serverId,
                event_time: new Date(),
            });
            console.log('Button click logged successfully');
        } catch (error) {
            console.error('Error logging button click:', error);
        }

        await handleButton(interaction, client);
    } else if (interaction.isStringSelectMenu()) {
        try {
            // Log the select menu interaction to the database
            await UsageLog.create({
                user_id: interaction.user.id,
                interaction_type: 'select_menu',
                event_type: 'select_menu_select',
                command_name: interaction.message.interaction.commandName,
                channel_id: interaction.channel.id,
                server_id: serverId,
                event_time: new Date(),
            });
            console.log('Select menu interaction logged successfully');
        } catch (error) {
            console.error('Error logging select menu interaction:', error);
        }

        await handleSelectMenu(interaction, client);
    } else if (interaction.isModalSubmit()) {
        try {
            let commandName = 'unknown';
            try{
                commandName = interaction.message.interaction.commandName;
            } catch (error){
                console.error('Command not known for Select Menu');
            };

            // Log the modal submit interaction to the database
            await UsageLog.create({
                user_id: interaction.user.id,
                interaction_type: 'modal_submit',
                event_type: 'modal_submit',
                command_name: commandName,
                channel_id: interaction.channel.id,
                server_id: serverId,
                event_time: new Date(),
            });
            console.log('Modal submit interaction logged successfully');
        } catch (error) {
            console.error('Error logging modal submit interaction:', error);
        }
        await handleModalSubmit(interaction, client);
    } else {
        console.log('Received an unsupported interaction type.');
    }
}

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

        await saveAnnouncementToDatabase(selectedChannelId, interaction.guild.id, embedData, formattedTime, client);

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

        // Create and send the select menu for channel selection based on roles defined in channelSelector.js
        const selectMenu = await createChannelSelectMenu(interaction.guild);
        await interaction.reply({ content: 'Please select a channel:', components: [selectMenu], ephemeral: true });
    }
}

module.exports = {
    handleInteraction
}