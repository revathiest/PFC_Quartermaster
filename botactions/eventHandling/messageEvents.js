const { UsageLog } = require('../../config/database');
const filter = require('../../messages.json');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const { trackChannelActivity } = require('../../botactions/ambient/ambientEngine');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 📜 Convert array-based prompts into clean strings
function normalizePrompt(input) {
    if (!input) return '';
    return Array.isArray(input) ? input.join('\n') : input;
}

module.exports = {
    handleMessageCreate: async function (message, client) {
        if (!message.guild || message.author.bot) return;

        //This is for the ambientEngine.js
        trackChannelActivity(message);

        const serverId = message.guild.id;

        // 🔥 OpenAI Trigger — Bot Mentioned
        if (message.mentions.has(client.user)) {
            // 🧠 Load prompt data
            let prompts = {};
            try {
                prompts = JSON.parse(
                    fs.readFileSync(path.join(__dirname, '../../userPrompts.json'), 'utf8')
                );
                console.log('🧠 Loaded prompt data successfully');
            } catch (err) {
                console.warn('⚠️ [PROMPT LOAD ERROR]', err);
                prompts = { default: ["You are a helpful and friendly AI assistant."] };
            }
        
            // 🛡️ Channel name check
            const allowedChannelNames = prompts.allowedChannelNames || [];
            const channelName = message.channel.name;
            if (!allowedChannelNames.includes(channelName)) {
                console.log(`🚫 [AI BLOCKED] Message in disallowed channel: ${channelName}`);
            
                const fallbackChannelName = allowedChannelNames[0];
                const fallbackChannel = message.guild.channels.cache.find(
                    ch => ch.name === fallbackChannelName && ch.isTextBased?.()
                );
            
                let reply = "Not here, crewman.";
                if (fallbackChannel) {
                    reply += ` Take it to ${fallbackChannel} if you've got something worth sayin’.`;
                } else {
                    reply += " Take it to an approved channel if you've got something worth sayin’.";
                }
            
                try {
                    await message.reply(reply);
                } catch (err) {
                    console.error('❌ [REPLY ERROR] Could not send fallback channel notice:', err);
                }
            
                return;
            }
                       
            const promptText = message.content.replace(/<@!?(\d+)>/, '').trim();
            if (!promptText) return;
        
            const model = process.env.OPENAI_MODEL;        

            const userId = message.author.id;
            const memberRoles = message.member?.roles?.cache;
            let finalPrompt = '';

            // 1️⃣ Specific User Prompt
            if (prompts.users?.[userId]) {
                finalPrompt = normalizePrompt(prompts.users[userId]);
                console.log(`👤 [PROMPT] Using custom prompt for user ${userId}`);

            // 2️⃣ Role-Based Prompt (dynamic)
            } else if (memberRoles) {
                const roleNames = memberRoles.map(role => role.name);
                const roleMappings = prompts.roleMappings || {};
                const basePrompt = normalizePrompt(prompts.default);
                let roleAddition = '';

                for (const [roleKey, mappedNames] of Object.entries(roleMappings)) {
                    if (mappedNames.some(mappedRole => roleNames.includes(mappedRole))) {
                        roleAddition = normalizePrompt(prompts.roles?.[roleKey]);
                        console.log(`🎭 [PROMPT] Matched role "${roleKey}" via "${mappedNames}"`);
                        break;
                    }
                }

                finalPrompt = [basePrompt, roleAddition].filter(Boolean).join('\n\n');

            // 3️⃣ Default Fallback
            } else {
                finalPrompt = normalizePrompt(prompts.default);
            }

            // 💬 ChatGPT Response
            try {
                const completion = await openai.chat.completions.create({
                    model: model,
                    messages: [
                        { role: "system", content: finalPrompt },
                        { role: "user", content: promptText }
                    ],
                    temperature: 0.7,
                });

                const reply = completion?.choices?.[0]?.message?.content;

                if (reply) {
                    await message.reply(reply);
                } else {
                    console.warn('⚠️ [OPENAI WARNING] No valid response from OpenAI.');
                    await message.reply("Hmm, I didn’t quite catch that. Try again?");
                }
            } catch (err) {
                console.error('❌ [OPENAI ERROR]', err);
                await message.reply("Sorry, I couldn't fetch a reply right now.");
            }
            return;
        }

        // 📜 Log the message
        try {
            await UsageLog.create({
                user_id: message.author.id,
                interaction_type: 'message',
                event_type: 'message_create',
                message_id: message.id,
                message_content: message.content,
                channel_id: message.channel.id,
                server_id: serverId,
                event_time: new Date(),
            });
            console.log('🗒️ Message logged successfully');
        } catch (error) {
            console.error('❌ Error logging message:', error);
        }

        // 🚨 Trigger filtering
        const content = message.content;
        const lowerCaseContent = content.toLowerCase();
        const personalTriggers = [];
        const regularTriggers = [];
        let allowMessage = true;

        for (const phrase in filter.words) {
            if (filter.words[phrase].action === "personal") {
                personalTriggers.push(phrase);
            } else {
                regularTriggers.push(phrase);
            }
        }

        for (const phrase of personalTriggers) {
            if (lowerCaseContent.includes(phrase)) {
                console.log(`👤 Checking personal trigger for "${phrase}"`);
                if (module.exports.performAction(message, client, filter.words[phrase])) return;
            }
        }

        for (const phrase of regularTriggers) {
            if (lowerCaseContent.includes(phrase)) {
                console.log(`🔎 Checking regular trigger for "${phrase}"`);
                if (module.exports.performAction(message, client, filter.words[phrase])) return;
            }
        }

        for (const regex in filter.regex) {
            const regexObj = new RegExp(regex, "i");
            if (regexObj.test(content) && allowMessage) {
                console.log(`🧪 Matched regex: ${regex}`);
                if (module.exports.performAction(message, client, filter.regex[regex])) return;
            }
        }
    },

    performAction: function (message, client, actionDetail) {
        if (actionDetail.action === "personal") {
            if (
                (actionDetail.userId && message.author.id === actionDetail.userId) ||
                (actionDetail.userId && message.author.username.toLowerCase() === actionDetail.userId.toLowerCase())
            ) {
                message.channel.send(actionDetail.response);
                return true;
            } else {
                console.log("🙅 Personal action ignored: User does not match");
                return false;
            }
        } else if (actionDetail.action === "respond") {
            message.channel.send(actionDetail.response);
            return true;
        } else if (actionDetail.action === "delete") {
            const channelName = message.channel.name;
            const username = message.author.username;
            const deletionMessage = `🗑️ The following message has been deleted from channel ${channelName}. Sender - ${username}`;
            const responseChannel = client.channels.cache.get(client.chanProfanityAlert);
            if (responseChannel && responseChannel.isTextBased?.()) {
                responseChannel.send(deletionMessage);
                responseChannel.send(message.content);
            }
            message.delete();
            return true;
        }

        return false;
    }
};