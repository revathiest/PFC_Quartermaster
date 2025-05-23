const { UsageLog } = require('../../config/database');

module.exports = {
    handleReactionAdd: async function(reaction, user) {
        if (user.bot) return; // Ignore bot reactions

        const { message, emoji } = reaction;
        const serverId = message.guild.id;

        try {
            await UsageLog.create({
                user_id: user.id,
                interaction_type: 'reaction',
                event_type: 'reaction_add',
                reaction_type: emoji.name, // Store the emoji name
                message_id: reaction.message.id,
                channel_id: message.channel.id,
                server_id: serverId,
                event_time: new Date(),
            });
            console.log('➕ Reaction add logged successfully');
        } catch (error) {
            console.error('❌ Error logging reaction add:', error);
        }
    },
    handleReactionRemove: async function(reaction, user) {
        if (user.bot) return; // Ignore bot reactions

        const { message, emoji } = reaction;
        const serverId = message.guild.id;

        try {
            await UsageLog.create({
                user_id: user.id,
                interaction_type: 'reaction',
                event_type: 'reaction_remove',
                reaction_type: emoji.name, // Store the emoji name
                channel_id: message.channel.id,
                server_id: serverId,
                event_time: new Date(),
            });
            console.log('➖ Reaction remove logged successfully');
        } catch (error) {
            console.error('❌ Error logging reaction remove:', error);
        }
    }
};