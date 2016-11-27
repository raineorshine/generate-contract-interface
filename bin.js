#!/usr/bin/env node

const generateInterface = require('./')
const stdin = require('get-stdin-promise')
const yargs = require('yargs')

const argv = yargs
  .usage(`Descrition:
  Generates an abstract contract in Solidity from a given contract. Pass contract source on stdin.

Example:
  $ generate-contract-interface < MyContract.sol`)
  .describe('importRoot', 'Specify the root import directory.')
  .default('importRoot', process.cwd())
  .help()
  .version()
  .argv

stdin
  .then(src => generateInterface(src, argv))
  .then(console.log)
  .catch(console.error)
