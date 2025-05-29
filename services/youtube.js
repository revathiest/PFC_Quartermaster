const { execFile } = require('child_process');
const debugLog = require('../utils/debugLogger');

function search(query) {
  return new Promise((resolve, reject) => {
    const cmd = process.env.YTDLP_PATH || 'yt-dlp';
    debugLog('Executing yt-dlp search with query:', query);
    execFile(cmd, ['-j', `ytsearch1:${query}`], (err, stdout) => {
      if (err) {
        debugLog('yt-dlp error:', err.message);
        return reject(err);
      }
      try {
        const info = JSON.parse(stdout.trim());
        const pageUrl = info.webpage_url || info.url;
        debugLog('yt-dlp returned url:', pageUrl);
        resolve(pageUrl); // use stable webpage URL
      } catch (e) {
        debugLog('Failed to parse yt-dlp output');
        reject(e);
      }
    });
  });
}

module.exports = { search };
