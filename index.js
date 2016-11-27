const SolidityParser = require('solidity-parser')
const flow = require('lodash.flow')
const path = require('path')
const fs = require('fs')

// since the parser currently parser modifiers into the same heap as constant, public, private, etc, we need to whitelist these
const notModifiers = {
  'constant': 1,
  'payable': 1,
  'public': 1,
  'private': 1,   // redundant: private functions get filtered out before modifiers are filtered
  'internal': 1,  // redundant: internal functions get filtered out before modifiers are filtered
  'returns': 1
}

/** Returns true if the given ast statement is a function. */
function isEnum(statement) {
  return statement.type === 'EnumDeclaration'
}

/** Returns true if the given ast statement is a function. */
function isFunction(statement) {
  return statement.type === 'FunctionDeclaration'
}

/** Returns true if the given ast statement is a DeclarativeExpression. */
function isDeclaration(statement) {
  // declarations are wrapped in an array for some reason
  return statement[0] && (statement[0].type === 'DeclarativeExpression' || statement[0].type === 'AssignmentExpression')
}

function isPublicDeclaration(statement) {
  return statement.is_public
}

/** Returns true if the given function ast is public. */
function isPublic(f) {
  return !f.modifiers || f.modifiers.every(mod => mod.name !== 'private' && mod.name !== 'internal')
}

/** Returns true if the given function ast is the fallback function. */
function isFallbackFunction(f) {
  return !f.name
}

/** Returns a function that returns true if the given object has a specific property value. */
function propEquals(prop, value) {
  return o => o[prop] === value
}

/** Inverts a boolean function. */
function not(f) {
  return (...args) => !f(...args)
}

/** Returns a function that calls any number of functions on the arguments and ANDs the results. */
function and(...fs) {
  return fs.reduce(and2)
}

/** Returns a function that calls two functions on the arguments and ANDs the results. */
function and2(f, g) {
  return (...args) => f(...args) && g(...args)
}

/** Convert an array to a lookup object. */
function toLookupObject(o, key) {
  o[key] = 1
  return o
}

/** Gets the return type of the given public variable's getter (needs specific handling for mappings). */
function getGetterReturnType(getter) {
  return getter.literal.literal.type === 'MappingExpression'
    ? getter.literal.literal.to.literal
    : getter.literal.literal
}

function generateInterface(src, options = {}) {

  options.importRoot = options.importRoot || process.cwd()

  // parse contract
  const ast = SolidityParser.parse(src)

  // get pragma statement
  const pragma = ast.body.find(statement => statement.type === 'PragmaStatement')
  const pragmaSrc = pragma ? src.slice(pragma.start, pragma.end) + '\n\n' : ''

  // get contract name
  const contract = ast.body.find(statement => statement.type === 'ContractStatement')
  const supers = contract.is.map(supercontract => supercontract.name).reduce(toLookupObject, {})

  const importStubs = ast.body.filter(statement => statement.type === 'ImportStatement')
    // get the import text
    .map(statement => statement.from)
    // filter out contracts that are not inherited
    .filter(flow(
      filepath => path.basename(filepath, '.sol'),
      contractName => contractName in supers
    ))
    .map(flow(
      // convert relative path to absolute
      importfile => path.join(options.importRoot, importfile),
      // read the file
      filepath => fs.readFileSync(filepath, 'utf-8'),
      // generate the interface of the inherited contract
      src => generateInterface(src, { stubsOnly: true })
    ))

  // generate a regular expression that matches any enum name that was defined in the contract
  const enumNames = contract.body ? contract.body
    .filter(isEnum)
    .map(en => en.name)
    : []
  const enumRegexp = new RegExp(enumNames.join('|'), 'g')
  const replaceEnums = str => enumNames.length ? str.replace(enumRegexp, 'uint') : str

  // get functions
  const functions = contract.body ? contract.body
    .filter(and(
      isFunction,
      isPublic,
      not(propEquals('name', contract.name)),
      not(isFallbackFunction)
    ))
    // filter out actual modifiers
    .map(f => {
      f.notModifiers = f.modifiers ? f.modifiers.filter(mod => mod.name in notModifiers) : []
      return f
    })
    : []

  // generate interface stubs for functions
  const functionStubs = functions
    .map(f => {
      const nameAndParams = f.params
        // if there are params, slice the function name plus all params
        // replace enums in params with uint
        ? replaceEnums(src.slice(f.start, f.params[f.params.length-1].end + 1))
        // otherwise just construct the simple signature
        : `function ${f.name}()`

      // get privacy and other non-custom modifiers
      const notModifiers = f.notModifiers.length ?
        // replace enums in returns with uint
        ' ' + f.notModifiers.map(notMod => replaceEnums(src.slice(notMod.start, notMod.end).trim())).join(' ') :
        ''

      return `  ${nameAndParams}${notModifiers};`
    })

  // generate interface stubs for public variable getters
  const getters = contract.body ? contract.body
    .filter(isDeclaration)
    .map(declaration => declaration[0].left || declaration[0])
    .filter(isPublicDeclaration)
    : []
  const getterStubs = getters.map(getter => `  function ${getter.name}() public constant returns(${getGetterReturnType(getter)});`)

  const stubs = [].concat(importStubs.length > 0 ? `\n  // inherited\n${importStubs}\n` : [], getterStubs, functionStubs).join('\n')

  return options.stubsOnly
    ? stubs
    : `${pragmaSrc}contract I${contract.name} {
${stubs}
}`
}

module.exports = generateInterface
