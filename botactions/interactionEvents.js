const { InteractionType } = require('discord.js');

module.exports = {
    handleInteraction: async function(interaction, client) {
        if (interaction.isCommand()) {
            await handleCommand(interaction, client);
        } else if (interaction.isButton()) {
            await handleButton(interaction, client);
        } else if (interaction.isSelectMenu()) {
            await handleSelectMenu(interaction, client);
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
    const command = client.commands.get(interaction.message.interaction.commandName);
    const message = `${interaction.user.username} selected option **${interaction.values[0]}** for command **${interaction.message.interaction.commandName}**`;
    client.channels.cache.get(client.chanBotLog).send(message);

    if (command && command.option) {
        await command.option(interaction, client);
    } else {
        console.error('Select menu handler not found.');
    }
}
