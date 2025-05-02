const https = require('https');

const options = {
  hostname: 'discord.com',
  path: `/api/v10/applications/YOUR_CLIENT_ID/guilds/YOUR_GUILD_ID/commands`,
  method: 'GET',
  headers: {
    'Authorization': `Bot YOUR_BOT_TOKEN`
  }
};

const req = https.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', d => process.stdout.write(d));
});

req.on('error', e => {
  console.error(e);
});

req.end();
