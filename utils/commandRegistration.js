const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const path = require('path');
const { clientId, guildId, token } = require('../config.json');

function loadCommandsRecursively(dir, commandList = [], commandMap = new Map()) {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    // 👇 Check if this directory has a sibling file of the same name + ".js"
    const parentFileName = path.basename(dir) + '.js';
    const parentFilePath = path.join(path.dirname(dir), parentFileName);

    if (fs.existsSync(parentFilePath)) {
        //console.log(`⚠️ Skipping directory "${dir}" because "${parentFileName}" exists → treating as subcommand folder.`);
        return { commandList, commandMap };
    }

    for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
            loadCommandsRecursively(fullPath, commandList, commandMap);
        } else if (file.isFile() && file.name.endsWith('.js')) {
            try {
                const command = require(fullPath);

                if (!command.data || typeof command.data.toJSON !== 'function') {
                    throw new TypeError(`Missing 'data' or 'toJSON' in ${file.name}`);
                }

                commandMap.set(command.data.name, command);
                commandList.push(command.data.toJSON());
                console.log(`✅ Loaded command: ${command.data.name}`);
            } catch (err) {
                //console.warn(`⚠️ Skipping "${file.name}": ${err.message}`);
            }
        }
    }

    return { commandList, commandMap };
}

async function registerCommands(client) {
    const commandsPath = path.join(__dirname, '../commands');
    const { commandList, commandMap } = loadCommandsRecursively(commandsPath);
    client.commands = commandMap;

    const rest = new REST({ version: '10' }).setToken(token);

    try {
        console.log('🔍 Fetching currently registered guild commands...');
        const existingCommands = await rest.get(Routes.applicationGuildCommands(clientId, guildId));
        console.log(`✅ Discord reports ${existingCommands.length} registered command(s):`, existingCommands.map(c => c.name));

        const existingNames = existingCommands.map(c => c.name).sort();
        const localNames = commandList.map(c => c.name).sort();

        const isSame = existingNames.length === localNames.length &&
                   existingNames.every((name, i) => name === localNames[i]);

        if (existingCommands.length === 0) {
            console.log('📝 No commands currently registered. Proceeding with registration...');
        } else if (isSame) {
            //console.log('ℹ️ Commands are in sync. Skipping registration.');
            //return;
        } else {
            console.log(`⚠️ Command mismatch detected. Proceeding with re-registration...`);
        }

        console.log('🔁 Syncing commands with Discord...');
        const response = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commandList }
        );
        console.log(`✅ Successfully registered ${response.length} command(s).`);
    } catch (error) {
        console.error('❌ Discord registration failed:', error);
    }
}

module.exports = registerCommands;
