// botactions/scheduling/scheduledAnnouncementEngine.js
const { getScheduledAnnouncements, deleteScheduledAnnouncement } = require('./scheduleHandler');
const { EmbedBuilder } = require('discord.js');
const { getChannelNameById, getGuildNameById } = require('../utilityFunctions');

async function checkScheduledAnnouncements(client) {
    try {
        const now = new Date(); // Local time
        const announcements = await getScheduledAnnouncements();

        for (const announcement of announcements) {
            const announcementTime = new Date(announcement.time).getTime();
            const nextScheduled = new Date(announcement.time).getTime();
            const nowTime = now.getTime();

            if (nowTime >= announcementTime) {
                console.log('✅ Announcement is ready to be sent.');
                const channel = await client.channels.fetch(announcement.channelId);

                if (channel && channel.guild.id === announcement.guildId) {
                    let embedData;
                    try {
                        console.log('🧾 Parsing embed data...');
                        embedData = JSON.parse(announcement.embedData);
                    } catch (e) {
                        console.error('❌ Failed to parse embedData:', e);
                        continue;
                    }

                    console.log('🧱 Building embed...');
                    const embed = new EmbedBuilder()
                        .setTitle(`📢  ${embedData.title}`)
                        .setDescription(embedData.description)
                        .setColor('#0099ff')
                        .setAuthor({ name: 'Pyro Freelancer Corps' })
                        .setTimestamp()
                        .setFooter({ text: 'Official PFC Communication', iconURL: 'https://i.imgur.com/5sZV5QN.png' });

                    const channelName = await getChannelNameById(announcement.channelId, client);
                    const guildName = await getGuildNameById(announcement.guildId, client);

                    console.log(`📨 Sending embed to channel: ${channelName} in server ${guildName}`);
                    await channel.send({ embeds: [embed] });
                    await deleteScheduledAnnouncement(announcement.id);
                    console.log(`🗑️ One-time announcement deleted from DB.`);
                } else {
                    console.warn(`⚠️ Could not send announcement — channel not found or guild ID mismatch: ${announcement.channelId}`);
                }
            } else {
                //do nothing
                //console.log('⏭️ Skipping announcement — not ready yet or recently sent.');
            }
        }
    } catch (error) {
        console.error('❌ Error checking scheduled announcements:', error);
    }
}

function startScheduledAnnouncementEngine(client) {
    setInterval(() => checkScheduledAnnouncements(client), 60 * 1000);
    console.log('🧭 Scheduled Announcement engine started');
}

module.exports = {
    startScheduledAnnouncementEngine
};
