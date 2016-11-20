# generate-contract-interface
[![npm version](https://img.shields.io/npm/v/generate-contract-interface.svg)](https://npmjs.org/package/generate-contract-interface)

Generates an abstract contract in Solidity from a given contract.

## Install

```sh
$ npm install --save generate-contract-interface
```

## CLI Usage

```js
$ generate-contract-interface < MyContract.sol > IMyContract.sol
```

## API Usage

```js
const generateInterface = require('generate-contract-interface')

const src = `pragma solidity ^0.4.4;

contract MyContract {
  function foo(uint a) constant public returns(uint) {
    return 0;
  }

  function bar(uint a, uint b) {
  }
}`

console.log(generateInterface(src))

/* Output:

pragma solidity ^0.4.4;

contract IMyContract {
  function foo(uint a) constant public returns(uint);
  function bar(uint a, uint b);
}
*/

```

## Issues

Before reporting, please makes sure your source is parseable via [solidity-parser](https://github.com/ConsenSys/solidity-parser).

## License

ISC © [Raine Revere](https://github.com/raineorshine)
