const { VerifiedUser, OrgTag } = require('../../config/database');
const {
  fetchRsiProfileInfo,
  ProfileNotFoundError,
  FetchFailedError
} = require('../../utils/rsiProfileScraper');
const { formatVerifiedNickname } = require('../../utils/formatVerifiedNickname');

const FAILURE_THRESHOLD = 3;

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

      await VerifiedUser.update(
        {
          rsiOrgId: scrapedOrgId,
          lastProfileCheck: new Date(),
          failedProfileChecks: 0
        },
        { where: { discordUserId: user.discordUserId } }
      );

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
      let failures = (user.failedProfileChecks || 0) + 1;
      if (error instanceof ProfileNotFoundError) {
        if (failures >= FAILURE_THRESHOLD) {
          console.warn(`⚠️ RSI profile not found for ${user.rsiHandle}. Removing verification.`);
          await VerifiedUser.destroy({ where: { discordUserId: user.discordUserId } });

          const member = await guild.members.fetch(user.discordUserId).catch(() => null);
          if (member && member.manageable) {
            const formattedNickname = formatVerifiedNickname(member.displayName, false, null);
            if (member.displayName !== formattedNickname) {
              await member.setNickname(formattedNickname);
            }
          }
          continue;
        } else {
          console.warn(`⚠️ RSI profile check failed for ${user.rsiHandle}. (${failures}/${FAILURE_THRESHOLD})`);
        }
      } else if (error instanceof FetchFailedError) {
        console.warn(`⚠️ Temporary failure fetching profile for ${user.rsiHandle}. (${failures}/${FAILURE_THRESHOLD})`);
      } else {
        console.error(`❌ Failed to process ${user.rsiHandle}:`, error);
      }

      await VerifiedUser.update(
        { failedProfileChecks: failures, lastProfileCheck: new Date() },
        { where: { discordUserId: user.discordUserId } }
      );
    }
  }
}

module.exports = { syncOrgTags };
