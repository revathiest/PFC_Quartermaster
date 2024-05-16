const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');

// Assuming config.json is in the root, adjust the path to go up one level from botactions
const { clientId, guildId, token } = require('../config.json');

const rest = new REST({ version: '9' }).setToken(token);

async function registerCommands(client) {
    client.commands = new Map();
    var cmdsToRegister = [];

    // Adjust the path to point to the commands directory correctly from botactions
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    console.log('Registering commands:');
    for (const file of commandFiles) {
        // Correct the path to import command modules correctly
        const command = require(`../commands/${file}`);
        try {
            client.commands.set(command.data.name, command);
            cmdsToRegister.push(command.data.toJSON ? command.data.toJSON() : command.data);
            console.log(`Registered command ${command.data.name}`);
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
