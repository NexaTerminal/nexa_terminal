// Employment Part 3: Работно време и одмор (Working Time and Rest)
const { createEmploymentModule } = require('./employmentModuleFactory');

module.exports = createEmploymentModule({
  data: require('../../data/lhc/employmentPart3Questions'),
  categoryKey: 'employment_part3',
  categoryTitle: 'Работни односи: Работно време и одмор',
  sectorPhrase: 'во делот на работно време и одмор'
});
