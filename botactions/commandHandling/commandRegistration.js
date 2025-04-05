// src/utils/registerCommands.js
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const path = require('path');
const { clientId, guildId, token } = require('../../config.json');

async function registerCommands(client) {
    const commands = [];
    const commandsPath = path.join(__dirname, '../../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if (!command.data || typeof command.data.toJSON !== 'function') {
            console.warn(`Skipping invalid command file: ${file}`);
            continue;
        }

        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: '10' }).setToken(token);

    try {
        console.log('Refreshing application (/) commands...');
        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );
        console.log('Successfully registered all commands.');
    } catch (error) {
        console.error('Failed to register commands:', error);
    }
}

module.exports = registerCommands;
