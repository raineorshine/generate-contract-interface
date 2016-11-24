const fs = require('fs')
const path = require('path')
const chai = require('chai')
const spawn = require('spawn-please')
const generateInterface = require('../')
const chaiAsPromised = require("chai-as-promised")
const should = chai.should()
chai.use(chaiAsPromised)

const src = fs.readFileSync(path.join(__dirname, 'test.sol'), 'utf-8')
const srcNoReturn = fs.readFileSync(path.join(__dirname, 'test-no-return.sol'), 'utf-8')
const srcMod = fs.readFileSync(path.join(__dirname, 'test-mod.sol'), 'utf-8')

const expectedOutput = `pragma solidity ^0.4.4;

contract IMyContract {
  function foo(uint a) public constant returns(uint);
}`
const expectedOutputNoReturn = `pragma solidity ^0.4.4;

contract IMyContract {
  function foo(uint a) public;
}`
const expectedOutputMod = `pragma solidity ^0.4.4;

contract IMyContract {
  function foo(uint a) public returns(uint);
}`

describe('generate-contract-interface', () => {

  it('should generate an interface', () => {
    generateInterface(src).should.equal(expectedOutput)
  })

  it('should generate an interface of a function with no return value', () => {
    generateInterface(srcNoReturn).should.equal(expectedOutputNoReturn)
  })

  it('should not include modifiers', () => {
    generateInterface(srcMod).should.equal(expectedOutputMod)
  })

  it('should read files from stdin', () => {
    return spawn('node', ['bin.js'], src).should.eventually.equal(expectedOutput + '\n')
  })

})
