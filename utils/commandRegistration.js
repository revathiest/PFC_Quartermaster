const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const path = require('path');
const { clientId, guildId, token } = require('../../config.json');

async function registerCommands(client) {
    const commands = [];
    const commandsPath = path.join(__dirname, '../../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    client.commands = new Map();

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);

        try {
            const command = require(filePath);

            if (!command.data || typeof command.data.toJSON !== 'function') {
                throw new TypeError(`File "${file}" is missing a valid 'data' property or toJSON method.`);
            }

            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
            console.log(`✅ Registered command: ${command.data.name}`);
        } catch (err) {
            console.warn(`⚠️ Skipping "${file}": ${err.message}`);
        }
    }

    const rest = new REST({ version: '10' }).setToken(token);

    try {
        console.log('🔁 Syncing commands with Discord...');
        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );
        console.log('✅ Successfully registered all commands.');
    } catch (error) {
        console.error('❌ Discord registration failed:', error);
    }
}

module.exports = registerCommands;
