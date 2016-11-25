const SolidityParser = require('solidity-parser')

// since the parser currently parser modifiers into the same heap as constant, public, private, etc, we need to whitelist these
const notModifiers = {
  'constant': 1,
  'payable': 1,
  'public': 1,
  'private': 1,
  'internal': 1,
  'returns': 1
}

module.exports = (src, options = {}) => {

  // parse contract
  const ast = SolidityParser.parse(src)

  // get pragma statement
  const pragma = ast.body.find(statement => statement.type === 'PragmaStatement')
  const pragmaSrc = pragma ? src.slice(pragma.start, pragma.end) + '\n' : ''

  // get contract name
  const contract = ast.body.find(statement => statement.type === 'ContractStatement')

  const functions = contract.body
    // only functions
    .filter(statement => statement.type === 'FunctionDeclaration')
    // no constructor
    .filter(statement => statement.name !== contract.name)
    // no fallback function
    .filter(statement => statement.name)
    // filter out actual modifiers
    .map(f => {
      f.notModifiers = f.modifiers ? f.modifiers.filter(mod => mod.name in notModifiers) : []
      return f
    })

  const stubs = functions
    .map(f => {
      const nameAndParams = f.params ?
        src.slice(f.start, f.params[f.params.length-1].end + 1) :
        `function ${f.name}()`
      const notModifiers = f.notModifiers.length ?
        ' ' + f.notModifiers.map(notMod => src.slice(notMod.start, notMod.end).trim()).join(' ') :
        ''
      return `  ${nameAndParams}${notModifiers};`
    })
    .join('\n')

  return `${pragmaSrc}
contract I${contract.name} {
${stubs}
}`
}
