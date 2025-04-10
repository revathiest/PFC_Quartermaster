const { saveAnnouncementToDatabase } = require('../scheduling/scheduleHandler');
const { createChannelSelectMenu } = require('../commandHandling/channelSelector');
const moment = require('moment');
const { UsageLog } = require('../../config/database');

let pendingChannelSelection = {};

async function handleInteraction(interaction, client) {
    if (!interaction) {
        console.error('Interaction is null or undefined');
        return;
    }

    const serverId = interaction.guild?.id ?? 'unknown';

    if (interaction.isCommand()) {
        try {
            await UsageLog.create({
                user_id: interaction.user.id,
                interaction_type: 'command',
                event_type: 'command_used',
                command_name: interaction.commandName,
                channel_id: interaction.channel.id,
                server_id: serverId,
                event_time: new Date(),
            });
            console.log('Command usage logged successfully');
        } catch (error) {
            console.error('Error logging command usage:', error);
        }

        await handleCommand(interaction, client);
    }

    else if (interaction.isButton()) {
        try {
            // Attempt to get the command name from the original slash command
            let commandName = interaction.message?.interaction?.commandName;
    
            // Fallback: try to guess it based on customId
            if (!commandName) {
                const id = interaction.customId;
                if (id.startsWith('uexinv_')) commandName = 'uexinventory';
                // add more customId patterns here if needed
            }
    
            await UsageLog.create({
                user_id: interaction.user.id,
                interaction_type: 'button',
                event_type: 'button_click',
                command_name: commandName || 'unknown',
                channel_id: interaction.channel.id,
                server_id: serverId,
                event_time: new Date(),
            });
            console.log(`Button click logged for command: ${commandName || 'unknown'}`);
        } catch (error) {
            console.error('Error logging button click:', error);
        }
    
        await handleButton(interaction, client);
    }
    
    

    else if (interaction.isStringSelectMenu()) {
        try {
            const commandName = interaction.message?.interaction?.commandName || 'unknown';

            await UsageLog.create({
                user_id: interaction.user.id,
                interaction_type: 'select_menu',
                event_type: 'select_menu_select',
                command_name: commandName,
                channel_id: interaction.channel.id,
                server_id: serverId,
                event_time: new Date(),
            });
            console.log(`Select menu interaction logged for command: ${commandName}`);
        } catch (error) {
            console.error('Error logging select menu interaction:', error);
        }

        await handleSelectMenu(interaction, client);
    }

    else if (interaction.isModalSubmit()) {
        try {
            const commandName = interaction.message?.interaction?.commandName || 'unknown';

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
    }

    else {
        console.log('Received an unsupported interaction type.');
    }
}

async function handleCommand(interaction, client) {
    const command = client.commands.get(interaction.commandName);
    let message = `${interaction.user.username} used command **${interaction.commandName}**`;
    if (interaction.options._hoistedOptions[0]) {
        message += ` with options **${interaction.options._hoistedOptions[0].value}**`;
    }

    client.channels.cache.get(client.chanBotLog)?.send(message);

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
    try {
        const commandName = interaction.message?.interaction?.commandName || 'unknown';
        const command = client.commands.get(commandName);

        const message = `${interaction.user.username} clicked button **${interaction.customId}** for command **${commandName}**`;
        client.channels.cache.get(client.chanBotLog)?.send(message);

        if (command && typeof command.button === 'function') {
            await command.button(interaction, client);
        } else {
            console.warn(`[WARN] No button handler found for command: ${commandName}`);
        }

    } catch (error) {
        console.error('[ERROR] handleButton failed:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Something went wrong handling that button.', ephemeral: true });
        }
    }
}

async function handleSelectMenu(interaction, client) {
    const userSelection = pendingChannelSelection[interaction.user.id];
    const selectedValue = interaction.values[0];
    const isChannelId = /^\d{17,19}$/.test(selectedValue);

    if (isChannelId) {
        const selectedChannelId = selectedValue;
        const selectedChannel = await interaction.guild.channels.fetch(selectedChannelId);

        if (userSelection) {
            const embedData = {
                title: userSelection.title,
                description: userSelection.description,
                author: userSelection.author
            };
            const time = moment(userSelection.time, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');

            await saveAnnouncementToDatabase(selectedChannelId, interaction.guild.id, embedData, time, client);

            await interaction.update({
                content: `Announcement scheduled for ${time} in channel ${selectedChannel.name}`,
                components: []
            });

            delete pendingChannelSelection[interaction.user.id];
            return;
        }
    }

    if (userSelection) {
        const embedData = {
            title: userSelection.title,
            description: userSelection.description,
            author: userSelection.author
        };
        const time = moment(userSelection.time, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');

        await saveAnnouncementToDatabase(selectedValue, interaction.guild.id, embedData, time, client);

        const selectedChannel = await interaction.guild.channels.fetch(selectedValue);

        await interaction.update({
            content: `Announcement scheduled for ${time} in channel ${selectedChannel.name}`,
            components: []
        });

        delete pendingChannelSelection[interaction.user.id];
    } else {
        const commandName = interaction.message?.interaction?.commandName || 'unknown';
        const command = client.commands.get(commandName);

        const message = `${interaction.user.username} selected option **${interaction.values[0]}** for command **${commandName}**`;
        client.channels.cache.get(client.chanBotLog)?.send(message);

        if (command && typeof command.option === 'function') {
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

        if (!moment(time, 'YYYY-MM-DD HH:mm:ss', true).isValid()) {
            await interaction.reply({ content: 'Invalid time format. Please use YYYY-MM-DD HH:mm:ss', ephemeral: true });
            return;
        }

        pendingChannelSelection[interaction.user.id] = { title, description, author, time };

        const selectMenu = await createChannelSelectMenu(interaction.guild);
        await interaction.reply({ content: 'Please select a channel:', components: [selectMenu], ephemeral: true });
    }
}

module.exports = {
    handleInteraction
};
