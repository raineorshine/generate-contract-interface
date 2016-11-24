const SolidityParser = require('solidity-parser')

module.exports = (src, options = {}) => {

  // parse contract
  let ast
  try {
    ast = SolidityParser.parse(src)
  }
  catch(e) {
    console.error('Error parsing contract', e)
    process.exit(1)
  }

  // get pragma statement
  const pragma = ast.body.find(statement => statement.type === 'PragmaStatement')
  const pragmaSrc = pragma ? src.slice(pragma.start, pragma.end) + '\n' : ''

  // get contract name
  const contract = ast.body.find(statement => statement.type === 'ContractStatement')

  const functions = contract.body
    .filter(statement => statement.type === 'FunctionDeclaration')
    .filter(statement => statement.name !== contract.name)

  const stubs = functions
    .map(f => '  ' + src.slice(f.start, f.modifiers[f.modifiers.length-1].end) + ';')
    .join('\n')

  return `${pragmaSrc}
contract I${contract.name} {
${stubs}
}`
}
