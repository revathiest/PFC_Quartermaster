const { createChannelSelectMenu } = require('../commandHandling/channelSelector');
const { UsageLog } = require('../../config/database');
const chrono = require('chrono-node');
const { MessageFlags } = require('discord.js');
const { pendingChannelSelection } = require('../../utils/pendingSelections');

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
            console.log('✅ Command usage logged successfully');
        } catch (error) {
            console.error('❌ Error logging command usage:', error);
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

            console.log(`🔘 Button click logged for command: ${commandName}`);
        } catch (error) {
            console.error('❌ Error logging button click:', error);
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
            console.log(`📑 Select menu interaction logged for command: ${commandName}`);
        } catch (error) {
            console.error('❌ Error logging select menu interaction:', error);
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
            console.log('📝 Modal submit interaction logged successfully');
        } catch (error) {
            console.error('❌ Error logging modal submit interaction:', error);
        }

        await handleModalSubmit(interaction, client);
    } else {
        console.log('⚠️ Received an unsupported interaction type.');
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
                flags: MessageFlags.Ephemeral
            });
            return;
        }
    }

    if (!command) {
        await interaction.reply('❌ Unable to find command...');
        return;
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
                    flags: MessageFlags.Ephemeral
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
            typeof cmd.button === 'function' &&
            cmd.data?.name &&
            interaction.customId.startsWith(cmd.data.name)
        );

        if (command) {
            await command.button(interaction, client);
        } else {
            console.warn(`⚠️ No button handler found for prefix: ${prefix}`);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Button handler not found.',
                    flags: MessageFlags.Ephemeral
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

        const command = [...client.commands.values()].find(cmd =>
            typeof cmd.option === 'function' &&
            cmd.data?.name &&
            id.startsWith(cmd.data.name)
        );

        const commandName = command?.data?.name || 'unknown';

        await UsageLog.create({
            user_id: interaction.user.id,
            interaction_type: 'select_menu',
            event_type: 'select_menu_select',
            command_name: commandName,
            channel_id: interaction.channel.id,
            server_id: interaction.guild?.id ?? 'unknown',
            event_time: new Date(),
        });

        if (command) {
            await command.option(interaction, client);
        } else {
            console.warn(`⚠️ No select menu handler matched for customId: ${id}`);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Select menu handler not found.',
                    flags: MessageFlags.Ephemeral
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
    if (interaction.customId === 'scheduleModal') {
        const title = interaction.fields.getTextInputValue('title');
        const description = interaction.fields.getTextInputValue('description');
        const author = 'PFC Quartermaster';
        const time = interaction.fields.getTextInputValue('time');

        const parsedTime = chrono.parseDate(time);
        if (!parsedTime || isNaN(parsedTime)) {
            await interaction.reply({
                content: '❌ Could not understand that time. Try something like "tomorrow at 5pm" or "in 15 minutes".',
                flags: MessageFlags.Ephemeral
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
            time: formattedTime
        };

        const selectMenu = await createChannelSelectMenu(interaction.guild, 'schedule');
        await interaction.reply({
            content: '📢 Please select a channel:',
            components: [selectMenu],
            flags: MessageFlags.Ephemeral
        });
    }
}

module.exports = {
    handleInteraction
};