const generateInterface = require('./')
const stdin = require('get-stdin-promise')

stdin
  .then(generateInterface)
  .then(console.log)
