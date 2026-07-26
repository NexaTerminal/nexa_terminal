// Employment Part 2: Работно место и заштита (Workplace and Worker Protection)
const { createEmploymentModule } = require('./employmentModuleFactory');

module.exports = createEmploymentModule({
  data: require('../../data/lhc/employmentPart2Questions'),
  categoryKey: 'employment_part2',
  categoryTitle: 'Работни односи: Работно место и заштита',
  sectorPhrase: 'во делот на работно место и заштита'
});
