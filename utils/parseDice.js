module.exports = function parseDice(formula) {
    const diceRegex = /^(\d*)d(\d+)(kh\d+|kl\d+)?([+-]\d+)?$/i;
    const match = formula.replace(/\s+/g, '').match(diceRegex);
  
    if (!match) throw new Error('Invalid dice format');
  
    const count = parseInt(match[1] || '1');
    const sides = parseInt(match[2]);
    const keep = match[3]; // e.g., kh3 or kl2
    const modifier = parseInt(match[4] || '0');
  
    if (count > 100 || sides > 1000) {
      throw new Error('Too many dice or sides. Calm down, wizard.');
    }
  
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  
    let kept = [...rolls];
    if (keep) {
      const keepHigh = keep.startsWith('kh');
      const num = parseInt(keep.slice(2));
      kept = rolls
        .sort((a, b) => keepHigh ? b - a : a - b)
        .slice(0, num);
    }
  
    const total = kept.reduce((sum, val) => sum + val, 0) + modifier;
  
    return {
      total,
      rolls: rolls.map(r => (kept.includes(r) ? `**${r}**` : `${r}`))
    };
  };
  