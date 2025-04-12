const { UsageLog } = require('../../config/database');
const filter = require('../../messages.json');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const knownRoles = require('../../knownRoles.json');

let quartermasterPrompt = '';
try {
    quartermasterPrompt = fs.readFileSync(
        path.join(__dirname, '../../quartermaster_prompt.txt'),
        'utf8'
    );
} catch (err) {
    console.error('[PROMPT LOAD ERROR]', err);
    quartermasterPrompt = 'You are a helpful and friendly bot.'; // Fallback
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = {
    handleMessageCreate: async function (message, client) {
        if (!message.guild || message.author.bot) return;

        const serverId = message.guild.id;

        // 🔥 NEW: If bot is mentioned, reply with OpenAI
        if (message.mentions.has(client.user)) {
            const prompt = message.content.replace(/<@!?(\d+)>/, '').trim();
            if (!prompt) return;

            const model = process.env.OPENAI_MODEL;

            // 🧠 Determine user role level by checking their roles
            const memberRoles = message.member?.roles?.cache;
            let userRoleLevel = 'default';

            if (memberRoles) {
                const roleNames = memberRoles.map(role => role.name);

                if (roleNames.some(role => knownRoles.leader.includes(role))) {
                    userRoleLevel = 'leader';
                } else if (roleNames.some(role => knownRoles.officer.includes(role))) {
                    userRoleLevel = 'officer';
                } else if (roleNames.some(role => knownRoles.quartermaster.includes(role))) {
                    userRoleLevel = 'quartermaster';
                }
            }

            // 🪖 Adjust prompt with rank-based respect
            let rolePrompt = quartermasterPrompt;

            if (userRoleLevel === 'leader') {
                rolePrompt += `\n\nYou are speaking to one of the organization's top-ranking officers. Mind your tone. Show respect — not with sweetness, but with recognition. They've bled for this crew. You don’t sass command.`;
            } else if (userRoleLevel === 'officer') {
                rolePrompt += `\n\nYou are speaking to a ranking officer in the organization. Watch your mouth. They’re not command, but they’ve held the line long enough to deserve your respect. You can be blunt — but keep it clean.`;
            } else if (userRoleLevel === 'quartermaster') {
                rolePrompt += `\n\nYou're speaking to a fellow Quartermaster. Speak like someone who's shared too many supply runs and not enough rations. Mutual respect, but still rough around the edges.`;
            }

            try {
                const completion = await openai.chat.completions.create({
                    model: model,
                    messages: [
                        { role: "system", content: rolePrompt },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7,
                });

                const reply = completion?.choices?.[0]?.message?.content;

                if (reply) {
                    await message.reply(reply);
                } else {
                    console.warn('[OPENAI WARNING] No valid response from OpenAI.');
                    await message.reply("Hmm, I didn’t quite catch that. Try again?");
                }
            } catch (err) {
                console.error('[OPENAI ERROR]', err);
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
            console.log('Message logged successfully');
        } catch (error) {
            console.error('Error logging message:', error);
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
                console.log('Checking personal trigger for "' + phrase + '"');
                if (module.exports.performAction(message, client, filter.words[phrase])) return;
            }
        }

        for (const phrase of regularTriggers) {
            if (lowerCaseContent.includes(phrase)) {
                console.log('Checking regular trigger for "' + phrase + '"');
                if (module.exports.performAction(message, client, filter.words[phrase])) return;
            }
        }

        for (const regex in filter.regex) {
            const regexObj = new RegExp(regex, "i");
            if (regexObj.test(content) && allowMessage) {
                console.log('Matched regex: ' + regex);
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
                console.log("Personal action ignored: User does not match");
                return false;
            }
        } else if (actionDetail.action === "respond") {
            message.channel.send(actionDetail.response);
            return true;
        } else if (actionDetail.action === "delete") {
            const channelName = message.channel.name;
            const username = message.author.username;
            const deletionMessage = `The following message has been deleted from channel ${channelName}. Sender - ${username}`;
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
