// Employment Part 1: Вработување и договори (Hiring and Contracts)
const { createEmploymentModule } = require('./employmentModuleFactory');

module.exports = createEmploymentModule({
  data: require('../../data/lhc/employmentPart1Questions'),
  categoryKey: 'employment_part1',
  categoryTitle: 'Работни односи: Вработување и договори',
  sectorPhrase: 'во делот на вработување и договори'
});
