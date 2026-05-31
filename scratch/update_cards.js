const fs = require('fs');

const content = fs.readFileSync('data/cards.ts', 'utf8');

// Parse and replace each card object block
const updated = content.replace(/\{[\s\S]*?id:\s*\"(u\d_c\d+)\"[\s\S]*?\}/g, (match, id) => {
  const num = parseInt(id.split('_c')[1], 10);
  let rarity = 'common';
  if (num >= 1 && num <= 4) rarity = 'common';
  else if (num >= 5 && num <= 6) rarity = 'uncommon';
  else if (num >= 7 && num <= 8) rarity = 'rare';
  else if (num === 9) rarity = 'epic';
  else if (num === 10) rarity = 'legendary';

  // Remove existing rarity line if it exists
  const withoutRarity = match.replace(/\s*rarity:\s*\"[^\"]*\",?\n?/g, '');
  
  // Insert rarity: "rarity" after the id line
  const withRarity = withoutRarity.replace(
    new RegExp('id:\\s*\"' + id + '\",?\\n?'),
    'id: "' + id + '",\n    rarity: "' + rarity + '",\n'
  );
  return withRarity;
});

fs.writeFileSync('data/cards.ts', updated, 'utf8');
console.log('Successfully updated cards.ts with 5-tier rarities!');
