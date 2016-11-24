const SolidityParser = require('solidity-parser')

// since the parser currently parser modifiers into the same heap as constant, public, private, etc, we need to whitelist these
const notModifiers = {
  'constant': 1,
  'public': 1,
  'private': 1,
  'internal': 1,
  'returns': 1
}

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
    // filter out actual modifiers
    .map(f => {
      f.notModifiers = f.modifiers.filter(mod => mod.name in notModifiers)
      return f
    })

  // console.log(functions[0])

  const stubs = functions
    // .map(f => ('  ' + src.slice(f.start, f.notModifiers[f.notModifiers.length-1].end)).trimRight() + ';')
    .map(f => {
      const nameAndParams = src.slice(f.start, f.params[f.params.length-1].end + 1)
      const modSpace = f.notModifiers.length > 0 ? ' ' : ''
      const notModifiers = f.notModifiers.map(notMod => src.slice(notMod.start, notMod.end).trim()).join(' ')
      return `  ${nameAndParams}${modSpace}${notModifiers};`
    })
    .join('\n')

  return `${pragmaSrc}
contract I${contract.name} {
${stubs}
}`
}
