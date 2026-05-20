import { TAXONOMY, getTotalTarget, getDistributionTargets } from '../scripts/curriculum-taxonomy.js';

const total = getTotalTarget();
console.log('\n📚 TAXONOMY CHECK');
console.log(`  Topics: ${TAXONOMY.length}`);
console.log(`  Target questions: ${total.toLocaleString()}`);

const dist = getDistributionTargets();
console.log(`  Distribution groups: ${dist.length}`);

const byClass: Record<string, number> = {};
for (const t of TAXONOMY) {
  byClass[t.class] = (byClass[t.class] || 0) + t.target_questions;
}
for (const cls of ['12','11','10','9','8']) {
  console.log(`  Class ${cls}: ${(byClass[cls]||0).toLocaleString()} questions`);
}

const jeeAdvExtras = TAXONOMY.filter(t => t.exam === 'JEEAdvanced' && ['mat_adv_number_theory','phy_adv_advanced_mech','che_adv_advanced_organic'].includes(t.id));
console.log(`\n  JEE Adv extra topics found: ${jeeAdvExtras.map(t => t.id).join(', ')}`);
