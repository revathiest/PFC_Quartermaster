const { VerifiedUser, OrgTag } = require('../../config/database');
const { fetchRsiProfileInfo } = require('../../utils/rsiProfileScraper');
const { formatVerifiedNickname } = require('../../utils/formatVerifiedNickname');

async function syncOrgTags(client) {
  const verifiedUsers = await VerifiedUser.findAll();
  const guild = client.guilds.cache.first();

  if (!guild) {
    console.warn('🚫 No guild found. Skipping org tag sync.');
    return;
  }

  for (const user of verifiedUsers) {
    try {
      const profile = await fetchRsiProfileInfo(user.rsiHandle);
      const scrapedOrgId = profile.orgId || null;

      // Update rsiOrgId in the DB if it changed
      if (scrapedOrgId !== user.rsiOrgId) {
        await VerifiedUser.update(
          { rsiOrgId: scrapedOrgId },
          { where: { discordUserId: user.discordUserId } }
        );
      }

      // Get the enforced tag from the org_tags table
      const orgTagEntry = await OrgTag.findByPk(scrapedOrgId);
      const enforcedTag = orgTagEntry ? orgTagEntry.tag : null;

      const member = await guild.members.fetch(user.discordUserId).catch(() => null);
      if (!member) continue;

      if (!member.manageable) {
        console.warn(`⚠️ Skipping ${member.user.tag}: Cannot manage this member.`);
        continue;
      }

      // Format and enforce nickname
      const formattedNickname = formatVerifiedNickname(member.displayName, true, enforcedTag);
      if (member.displayName !== formattedNickname) {
        await member.setNickname(formattedNickname);
      }

    } catch (error) {
      // Handle profile not found case
      if (error.message && error.message.includes('Unable to fetch RSI profile')) {
        console.warn(`⚠️ RSI profile not found for ${user.rsiHandle}. Removing verification.`);

        // Remove from the database
        await VerifiedUser.destroy({ where: { discordUserId: user.discordUserId } });

        // Try to fetch the member to update their nickname
        const member = await guild.members.fetch(user.discordUserId).catch(() => null);
        if (!member) continue;

        if (!member.manageable) {
          console.warn(`⚠️ Skipping nickname update for ${member.user.tag}: Cannot manage this member.`);
          continue;
        }

        // Update nickname to show unverified status
        const formattedNickname = formatVerifiedNickname(member.displayName, false, null);
        if (member.displayName !== formattedNickname) {
          await member.setNickname(formattedNickname);
        }

        continue;
      }

      // Other errors: log and continue
      console.error(`❌ Failed to process ${user.rsiHandle}:`, error);
    }
  }
}

module.exports = { syncOrgTags };
