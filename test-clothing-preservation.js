const { getDetailedStylePrompt } = require('./lib/style-prompts.ts');

console.log('=== CHECKING STYLE PROMPTS FOR CLOTHING PRESERVATION ===\n');

const styles = ['cartoon', 'anime', 'pixar', 'watercolor', 'comic', 'vintage'];

styles.forEach(style => {
  const prompt = getDetailedStylePrompt(style);
  const hasClothingPreservation = prompt.includes('PRESERVE ALL CLOTHING') || prompt.includes('clothing silhouettes');
  console.log(`${style.toUpperCase()}: ${hasClothingPreservation ? '✅' : '❌'} clothing preservation`);
  if (hasClothingPreservation) {
    const clothingMatch = prompt.match(/(PRESERVE ALL CLOTHING[^.]*\.)/i);
    if (clothingMatch) {
      console.log(`  → ${clothingMatch[1]}`);
    }
  }
  console.log('');
});
