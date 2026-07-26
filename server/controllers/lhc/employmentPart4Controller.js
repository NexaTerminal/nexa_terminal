// Employment Part 4: Посебна заштита (Special Protection)
const { createEmploymentModule } = require('./employmentModuleFactory');

module.exports = createEmploymentModule({
  data: require('../../data/lhc/employmentPart4Questions'),
  categoryKey: 'employment_part4',
  categoryTitle: 'Работни односи: Посебна заштита',
  sectorPhrase: 'во делот на посебна заштита'
});
