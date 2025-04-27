const { VerifiedUser, OrgTag } = require('../../config/database');
const { fetchRsiProfileInfo } = require('../../utils/rsiProfileScraper');
const { formatVerifiedNickname } = require('../../utils/formatVerifiedNickname');

async function syncOrgTags(client) {
  const verifiedUsers = await VerifiedUser.findAll();
  const guild = client.guilds.cache.first();

  if (!guild) {
    console.warn('[SYNC] No guild found. Skipping sync.');
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
        console.log(`[SYNC] Updated rsiOrgId for ${user.rsiHandle}: ${user.rsiOrgId} → ${scrapedOrgId}`);
      }

      // Get the enforced tag from the org_tags table
      const orgTagEntry = await OrgTag.findByPk(scrapedOrgId);
      const enforcedTag = orgTagEntry ? orgTagEntry.tag : null;

      const member = await guild.members.fetch(user.discordUserId).catch(() => null);
      if (!member) continue;

      if (!member.manageable) {
        console.warn(`[SYNC] Skipping ${member.user.tag}: Cannot manage this member.`);
        continue;
      }

      // Format and enforce nickname
      const formattedNickname = formatVerifiedNickname(member.displayName, true, enforcedTag);
      if (member.displayName !== formattedNickname) {
        await member.setNickname(formattedNickname);
        console.log(`[SYNC] Updated nickname for ${user.rsiHandle} to "${formattedNickname}"`);
      }

    } catch (error) {
      // Handle profile not found case
      if (error.message && error.message.includes('Unable to fetch RSI profile')) {
        console.warn(`[SYNC] RSI profile not found for ${user.rsiHandle}. Removing verification.`);

        // Remove from the database
        await VerifiedUser.destroy({ where: { discordUserId: user.discordUserId } });

        // Try to fetch the member to update their nickname
        const member = await guild.members.fetch(user.discordUserId).catch(() => null);
        if (!member) continue;

        if (!member.manageable) {
          console.warn(`[SYNC] Skipping nickname update for ${member.user.tag}: Cannot manage this member.`);
          continue;
        }

        // Update nickname to show unverified status
        const formattedNickname = formatVerifiedNickname(member.displayName, false, null); // Unverified, no tag
        if (member.displayName !== formattedNickname) {
          await member.setNickname(formattedNickname);
          console.log(`[SYNC] Updated nickname for ${user.rsiHandle} to "${formattedNickname}" (unverified)`);
        }

        continue; // Move to next user, do not rethrow
      }

      // Other errors: log and continue
      console.error(`[SYNC] Failed to process ${user.rsiHandle}:`, error);
    }
  }
}

module.exports = { syncOrgTags };
