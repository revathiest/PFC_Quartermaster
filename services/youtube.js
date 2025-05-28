const { execFile } = require('child_process');

function search(query) {
  return new Promise((resolve, reject) => {
    execFile(process.env.YTDLP_PATH || 'yt-dlp', ['-j', `ytsearch1:${query}`], (err, stdout) => {
      if (err) return reject(err);
      try {
        const info = JSON.parse(stdout.trim());
        resolve(info.url); // direct URL
      } catch (e) {
        reject(e);
      }
    });
  });
}

module.exports = { search };
