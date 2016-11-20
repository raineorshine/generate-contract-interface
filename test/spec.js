const fs = require('fs')
const path = require('path')
const chai = require('chai')
const spawn = require('spawn-please')
const generateInterface = require('../')
const chaiAsPromised = require("chai-as-promised")
const should = chai.should()
chai.use(chaiAsPromised)

const src = fs.readFileSync(path.join(__dirname, 'test.sol'), 'utf-8')
const expectedOutput = `pragma solidity ^0.4.4;

contract IMyContract {
  function foo(uint a) public constant returns(uint);
}`

describe('generate-contract-interface', () => {

  it('should generate an interface', () => {
    generateInterface(src).should.equal(expectedOutput)
  })

  it('should read files from stdin', () => {
    return spawn('node', ['bin.js'], src).should.eventually.equal(expectedOutput + '\n')
  })

})
