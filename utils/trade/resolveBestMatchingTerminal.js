/**
 * Smart fuzzy resolver for best-matching terminal by input string.
 * Scores each terminal using tiered weighted criteria.
 * Returns the best match (or null if nothing found).
 */

 function resolveBestMatchingTerminal(input, terminals) {
    const normInput = input.trim().toLowerCase();
    let bestMatch = null;
    let bestScore = 0;
  
    for (const terminal of terminals) {
      const candidates = [
        { value: terminal.code, weight: 100 },
        { value: terminal.nickname, weight: 90 },
        { value: terminal.name, weight: 80 },
        { value: terminal.space_station_name, weight: 70 },
        { value: terminal.city_name, weight: 60 },
        { value: terminal.planet_name, weight: 50 },
        { value: terminal.outpost_name, weight: 40 },
        { value: terminal.orbit_name, weight: 30 },
        { value: terminal.star_system_name, weight: 20 },
      ];
  
      for (const { value, weight } of candidates) {
        if (!value) continue;
  
        const val = value.toLowerCase();
        let score = 0;
  
        if (val === normInput) {
          score = weight + 20; // exact match bonus
        } else if (val.startsWith(normInput)) {
          score = weight + 10; // prefix bonus
        } else if (val.includes(normInput)) {
          score = weight; // partial match
        }
  
        if (score > bestScore) {
          bestScore = score;
          bestMatch = terminal;
        }
      }
    }
  
    return bestScore > 0 ? bestMatch : null;
  }
  
  module.exports = {
    resolveBestMatchingTerminal
  };
  