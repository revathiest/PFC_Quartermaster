const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');
const crypto = require('crypto');
const { VerificationCode, VerifiedUser, OrgTag } = require('../../config/database');
const { fetchRsiProfileInfo } = require('../../utils/rsiProfileScraper');
const { formatVerifiedNickname } = require('../../utils/formatVerifiedNickname');
const pendingVerifications = new Set();

module.exports = {
  pendingVerifications: pendingVerifications,
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verify your RSI identity and link your Discord profile.')
    .addStringOption(option =>
      option.setName('rsi_handle')
        .setDescription('Your RSI handle (case-sensitive!)')
        .setRequired(true)
    ),
  help: 'Links your RSI profile to your Discord account using a temporary code. Adds org tags to your nickname and updates roles if you belong to a registered organization.',
  category: 'User',

  async execute(interaction) {
    const discordUserId = interaction.user.id;
    const rsiHandle = interaction.options.getString('rsi_handle');
    const user = interaction.user;
    const member = interaction.member;

    const code = `PFC-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const existing = await VerifiedUser.findOne({ where: { rsiHandle } });
      console.log(`[VERIFY EXECUTE] Checking existing verification for handle: ${rsiHandle}`);

      if (existing && existing.discordUserId !== user.id) {
        return interaction.editReply({
          content: `❌ This RSI profile is already linked to another Discord user.`,
        });
      }

      await VerificationCode.upsert({ discordUserId, code, createdAt: now, expiresAt });
      console.log(`[VERIFY EXECUTE] Verification code upserted: ${code}`);

      const verifyButton = new ButtonBuilder()
        .setCustomId(`verify_now::${rsiHandle}::${code}`)
        .setLabel('✅ Check Now')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(verifyButton);

      await interaction.editReply({
        content: [
          `🛠️ Let's get you verified, ${rsiHandle}.`,
          `1. Go to your RSI profile: https://robertsspaceindustries.com/citizens/${rsiHandle}`,
          `2. Add this code to your **bio**: \`\`\`${code}\`\`\``,
          `3. Once it's saved, click the button below to complete verification.`,
          ``,
          `⚠️ This code will expire in 15 minutes.`,
        ].join('\n'),
        components: [row]
      });

    } catch (err) {
      console.error('Verification start error:', err);
      await interaction.editReply({
        content: '❌ Something went wrong while starting verification. Try again later.'
      });
    }
  },

  async button(interaction, client) {
    const [_, rsiHandle, code] = interaction.customId.split('::');
    const user = interaction.user;
    const member = interaction.member;

    pendingVerifications.add(user.id);
    console.log(`[VERIFY BUTTON] Added ${user.id} to pendingVerifications.`);

    await interaction.deferUpdate();

    try {
      console.log(`[VERIFY BUTTON] Fetching RSI profile info for: ${rsiHandle}`);
      const { bio, orgId } = await fetchRsiProfileInfo(rsiHandle);
      console.log(`[VERIFY BUTTON] Fetched bio: ${bio}, orgId: ${orgId}`);

      if (!bio || !bio.includes(code)) {
        console.log(`[VERIFY BUTTON] Code not found in bio for handle: ${rsiHandle}`);
        pendingVerifications.delete(user.id);
        return interaction.editReply({
          content: `❌ Couldn't find the code in your RSI bio.\nMake sure you've saved this:\n\`\`\`${code}\`\`\`\nThen click the button again.`,
        });
      }

      const tag = orgId
        ? (await OrgTag.findByPk(orgId.toUpperCase()))?.tag || null
        : null;
      console.log(`[VERIFY BUTTON] Tag determined: ${tag}`);

      if (orgId === 'PFCS') {
        const recruitRole = interaction.guild.roles.cache.find(r => r.name === 'Recruit');
        const ensignRole = interaction.guild.roles.cache.find(r => r.name === 'Ensign');
        const pfcRole = interaction.guild.roles.cache.find(r => r.name === 'Pyro Freelancer Corps');

        if (recruitRole && ensignRole && member.roles.cache.has(recruitRole.id)) {
          try {
            await member.roles.remove(recruitRole);
            await member.roles.add(ensignRole);
            await member.roles.add(pfcRole);
            console.log(`[VERIFY BUTTON] Role updated: Recruit → Ensign`);
          } catch (err) {
            console.warn(`[VERIFY BUTTON] Couldn't update roles:`, err.message);
          }
        }
      }

      console.log(`[VERIFY BUTTON] Upserting verified user record.`);
      await VerifiedUser.upsert({
        discordUserId: user.id,
        rsiHandle,
        rsiOrgId: orgId,
        verifiedAt: new Date()
      });

      if (tag) {
        const currentNick = member.displayName;
        const newNick = formatVerifiedNickname(currentNick, true, tag);
        console.log(`[VERIFY BUTTON] Setting nickname: ${newNick}`);

        try {
          await member.setNickname(newNick);
        } catch (err) {
          console.warn(`[VERIFY BUTTON] Couldn't update nickname:`, err.message);
        }
      }

      await interaction.editReply({
        content: `✅ You're verified as **${rsiHandle}**.${tag ? ` You've been tagged as \`[${tag}]\`.` : ''} You can now remove the verification code from your profile.`,
        components: []
      });

    } catch (err) {
      console.error(`[VERIFY BUTTON] Error:`, err);
      await interaction.editReply({
        content: `❌ Something went wrong while verifying your profile. Try again later.`,
        components: []
      });
    } finally {
      pendingVerifications.delete(user.id);
      console.log(`[VERIFY BUTTON] Removed ${user.id} from pendingVerifications.`);
    }
  }
};
