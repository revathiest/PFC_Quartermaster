const { VerifiedUser, OrgTag } = require('../../config/database');
const { fetchRsiProfileInfo } = require('../../utils/rsiProfileScraper');
const { formatVerifiedNickname } = require('../../utils/formatVerifiedNickname');  // Assuming this is your formatter

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

      // ✅ Update rsiOrgId in the DB if it changed
      if (scrapedOrgId !== user.rsiOrgId) {
        await VerifiedUser.update(
          { rsiOrgId: scrapedOrgId },
          { where: { discordUserId: user.discordUserId } }
        );
        console.log(`[SYNC] Updated rsiOrgId for ${user.rsiHandle}: ${user.rsiOrgId} → ${scrapedOrgId}`);
      }

      // ✅ Get the enforced tag from the org_tags table
      const orgTagEntry = await OrgTag.findByPk(scrapedOrgId);
      const enforcedTag = orgTagEntry ? orgTagEntry.tag : null;

      const member = await guild.members.fetch(user.discordUserId).catch(() => null);
      if (!member) continue;

      if (!member.manageable) {
        console.warn(`[SYNC] Skipping ${member.user.tag}: Cannot manage this member.`);
        continue;
      }

      // ✅ Use your formatter to build the proper nickname
      const formattedNickname = formatVerifiedNickname(member.displayName, true, enforcedTag);
      if (member.displayName !== formattedNickname) {
        await member.setNickname(formattedNickname);
        console.log(`[SYNC] Updated nickname for ${user.rsiHandle} to "${formattedNickname}"`);
      }
    } catch (error) {
      console.error(`[SYNC] Failed to process ${user.rsiHandle}:`, error);
    }
  }
}

module.exports = { syncOrgTags };
