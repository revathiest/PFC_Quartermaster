const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const path = require('path');
const { clientId, guildId, token } = require('../../config.json');

const rest = new REST({ version: '9' }).setToken(token);

async function registerCommands(client) {
    client.commands = new Map();
    const cmdsToRegister = [];

    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    console.log('Registering commands:');
    for (const file of commandFiles) {
        const command = require(`../../commands/${file}`);
        try {
            // Check if command.data has a toJSON method
            if (typeof command.data.toJSON === 'function') {
                client.commands.set(command.data.name, command);
                cmdsToRegister.push(command.data.toJSON());
                console.log(`Registered command ${command.data.name}`);
            } else {
                throw new TypeError(`command.data.toJSON is not a function for ${command.data.name}`);
            }
        } catch (error) {
            console.error(`Error registering command ${command.data.name}:`, error);
        }
    }

    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: cmdsToRegister }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error reloading application (/) commands:', error);
    }
}

module.exports = { registerCommands };
