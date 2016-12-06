# generate-contract-interface
[![npm version](https://img.shields.io/npm/v/generate-contract-interface.svg)](https://npmjs.org/package/generate-contract-interface)

Generates an abstract contract in Solidity from a given contract.

## Install

```sh
$ npm install --save generate-contract-interface
```

## CLI Usage

```js
$ generate-contract-interface < MyContract.sol
```

It does support inheritance, although it currently only works if you are doing one contract per file. You may specify a root directory for imports if it is different from the current working directory:

```js
$ generate-contract-interface --importRoot ./contracts < MyContract.sol
```

MyContract.sol:

```js
import './B.sol';

contract A is B {
  function a() {
  }
}
```

B.sol:

```js
contract B {
  function b() {
  }
}
```

Output:

```
contract IA {
  function b();
  function a();
}
```


## API Usage

```js
const generateInterface = require('generate-contract-interface')

const src = `contract MyContract {
  function foo(uint a) constant public returns(uint) {
    return 0;
  }

  function bar(uint a, uint b) {
  }
}`

console.log(generateInterface(src))

/* Output:

contract IMyContract {
  function foo(uint a) constant public returns(uint);
  function bar(uint a, uint b);
}
*/

```

## Issues

Before reporting, please makes sure your source is parseable via [solidity-parser](https://github.com/ConsenSys/solidity-parser).

### Contributing Opportunities

The following are known issues and great opportunities to make an open source contribution:

- Does not handle multiple contracts per file.
- Duplicates methods shadowing inherited methods.
- Does not output multiple levels of inheritance properly.

## License

ISC © [Raine Revere](https://github.com/raineorshine)
