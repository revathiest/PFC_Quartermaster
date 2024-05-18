const { UsageLog } = require('../../config/database');

// In handleInteraction function, add server-specific logging
module.exports = {
    handleInteraction: async function(interaction, client) {
        const serverId = interaction.guild.id; // Get the server ID

        if (interaction.isCommand()) {
            try {
                // Log the command usage to the database
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
                // Log the modal submit interaction to the database
                await UsageLog.create({
                    user_id: interaction.user.id,
                    interaction_type: 'modal_submit',
                    event_type: 'modal_submit',
                    command_name: interaction.message.interaction.commandName,
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
};
