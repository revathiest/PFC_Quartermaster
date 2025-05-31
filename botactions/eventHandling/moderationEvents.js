const { UsageLog } = require('../../config/database');

module.exports = {
  handleGuildMemberRemove: async function(member) {
    const guild = member.guild;
    const serverId = guild.id;
    try {
      const logs = await guild.fetchAuditLogs({ type: 20, limit: 1 });
      const entry = logs?.entries?.first?.();
      const isKick = entry && entry.target && entry.target.id === member.id &&
        Date.now() - entry.createdTimestamp < 5000;
      if (isKick) {
        await UsageLog.create({
          user_id: member.id,
          interaction_type: 'moderation',
          event_type: 'kick',
          server_id: serverId,
          event_time: new Date(),
        });
        console.log('✅ Kick logged successfully');
      }
    } catch (err) {
      console.error('❌ Error logging kick:', err);
    }
  },

  handleGuildBanAdd: async function(ban) {
    const { user, guild } = ban;
    try {
      await UsageLog.create({
        user_id: user.id,
        interaction_type: 'moderation',
        event_type: 'ban',
        server_id: guild.id,
        event_time: new Date(),
      });
      console.log('✅ Ban logged successfully');
    } catch (err) {
      console.error('❌ Error logging ban:', err);
    }
  },

  handleGuildMemberUpdate: async function(oldMember, newMember) {
    const oldTimeout = oldMember.communicationDisabledUntil;
    const newTimeout = newMember.communicationDisabledUntil;
    if (oldTimeout === newTimeout) return;
    const serverId = newMember.guild.id;
    const userId = newMember.id;
    try {
      if (!oldTimeout && newTimeout) {
        await UsageLog.create({
          user_id: userId,
          interaction_type: 'moderation',
          event_type: 'timeout_start',
          server_id: serverId,
          event_time: new Date(),
        });
        console.log('✅ Timeout started logged successfully');
      } else if (oldTimeout && !newTimeout) {
        await UsageLog.create({
          user_id: userId,
          interaction_type: 'moderation',
          event_type: 'timeout_end',
          server_id: serverId,
          event_time: new Date(),
        });
        console.log('✅ Timeout ended logged successfully');
      }
    } catch (err) {
      console.error('❌ Error logging timeout:', err);
    }
  }
};
