const { createChannelSelectMenu } = require('../commandHandling/channelSelector');
const moment = require('moment');
const { UsageLog } = require('../../config/database');

let pendingChannelSelection = {};

function getPrefixFromCustomId(customId) {
    return customId.split('::')[0];
}

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
    } else if (interaction.isButton()) {
        try {
            let commandName = interaction.message?.interaction?.commandName;
            if (!commandName) {
                const id = interaction.customId;
                const prefix = getPrefixFromCustomId(id);
                const matched = [...client.commands.values()].find(cmd =>
                    typeof cmd.button === 'function' && id.startsWith(prefix)
                );
                commandName = matched?.data?.name || 'unknown';
            }

            await UsageLog.create({
                user_id: interaction.user.id,
                interaction_type: 'button',
                event_type: 'button_click',
                command_name: commandName,
                channel_id: interaction.channel.id,
                server_id: serverId,
                event_time: new Date(),
            });

            console.log(`Button click logged for command: ${commandName}`);
        } catch (error) {
            console.error('Error logging button click:', error);
        }

        await handleButton(interaction, client);
    } else if (interaction.isStringSelectMenu()) {
        try {
            const id = interaction.customId;
            const prefix = getPrefixFromCustomId(id);
            const matched = [...client.commands.values()].find(cmd =>
                typeof cmd.option === 'function' && id.startsWith(prefix)
            );
            const commandName = matched?.data?.name || 'unknown';

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
    } else if (interaction.isModalSubmit()) {
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
        const prefix = getPrefixFromCustomId(interaction.customId);
        const command = [...client.commands.values()].find(cmd => typeof cmd.button === 'function' && interaction.customId.startsWith(prefix));

        if (command) {
            await command.button(interaction, client);
        } else {
            console.warn(`[WARN] No button handler found for prefix: ${prefix}`);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Button handler not found.',
                    ephemeral: true
                });
            }
        }
    } catch (err) {
        console.error('[ERROR] handleButton() failed:', err);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Something went wrong.', ephemeral: true });
        }
    }
}

async function handleSelectMenu(interaction, client) {
    try {
        const prefix = getPrefixFromCustomId(interaction.customId);
        const command = [...client.commands.values()].find(cmd => typeof cmd.option === 'function' && interaction.customId.startsWith(prefix));

        if (command) {
            await command.option(interaction, client);
        } else {
            console.warn(`[WARN] No select menu handler found for prefix: ${prefix}`);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Select menu handler not found.',
                    ephemeral: true
                });
            }
        }
    } catch (err) {
        console.error('[ERROR] handleSelectMenu() failed:', err);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Something went wrong.', ephemeral: true });
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