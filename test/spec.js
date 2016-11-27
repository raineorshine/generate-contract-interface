const fs = require('fs')
const path = require('path')
const chai = require('chai')
const spawn = require('spawn-please')
const generateInterface = require('../')
const chaiAsPromised = require("chai-as-promised")
const should = chai.should()
chai.use(chaiAsPromised)

describe('generate-contract-interface', () => {

  it('should generate an interface', () => {
    const src = `contract MyContract {
  function foo(uint a) public constant returns(uint) {
  }
}
`
    const expectedOutput = `contract IMyContract {
  function foo(uint a) public constant returns(uint);
}`
    generateInterface(src).should.equal(expectedOutput)
  })

  it('should generate an interface with a pragma', () => {
    const src = `pragma solidity ^0.4.4;

contract MyContract {
  function foo(uint a) public constant returns(uint) {
  }
}
`
    const expectedOutput = `pragma solidity ^0.4.4;

contract IMyContract {
  function foo(uint a) public constant returns(uint);
}`
    generateInterface(src).should.equal(expectedOutput)
  })

  it('should generate an interface with public variable getters', () => {
    const src = `contract MyContract {
  uint public foo;
  uint private bar;
}
`
    const expectedOutput = `contract IMyContract {
  function foo() public constant returns(uint);
}`
    generateInterface(src).should.equal(expectedOutput)
  })

  it('should generate an interface with public variable involving assignments', () => {
    const src = `contract MyContract {
  uint public foo = 10;
}
`
    const expectedOutput = `contract IMyContract {
  function foo() public constant returns(uint);
}`
    generateInterface(src).should.equal(expectedOutput)
  })

  it('should generate an interface with public mapping getters', () => {
    const src = `contract MyContract {
  mapping(address => bool) public foo;
}
`
    const expectedOutput = `contract IMyContract {
  function foo() public constant returns(bool);
}`
    generateInterface(src).should.equal(expectedOutput)
  })


  it('should generate an interface of a function with no return value', () => {
    const src = `contract MyContract {
  function foo(uint a) public {
  }
}
`
    const expectedOutputNoReturn = `contract IMyContract {
  function foo(uint a) public;
}`
    generateInterface(src).should.equal(expectedOutputNoReturn)
  })

  it('should not include modifiers', () => {
    const src = `contract MyContract {
  function foo(uint a) lock public returns(uint) {
  }
}
`
    const expectedOutput = `contract IMyContract {
  function foo(uint a) public returns(uint);
}`

    generateInterface(src).should.equal(expectedOutput)
  })

  it('should not include the fallback function', () => {
    const src = `contract MyContract {
  function() payable {};
  function foo(uint a) public constant returns(uint) {
    return 10;
  };
}`
    const expectedOutput = `contract IMyContract {
  function foo(uint a) public constant returns(uint);
}`
    generateInterface(src).should.equal(expectedOutput)
  })

  it('should not include private and internal functions', () => {
    const src = `contract MyContract {
  function foo() {};
  function foo2() public {};
  function bar() private {};
  function baz() internal {};
}`
    const expectedOutput = `contract IMyContract {
  function foo();
  function foo2() public;
}`

    generateInterface(src).should.equal(expectedOutput)
  })

  it('should replace enums in params with uint', () => {
    const src = `contract MyContract {
  enum MyEnum { A, B, C }
  enum OtherEnum { D, E, F }
  function foo(MyEnum e) {};
  function bar(OtherEnum e) {};
}`
    const expectedOutput = `contract IMyContract {
  function foo(uint e);
  function bar(uint e);
}`

    generateInterface(src).should.equal(expectedOutput)
  })

  it('should replace enums in returns with uint', () => {
    const src = `contract MyContract {
  enum MyEnum { A, B, C }
  function foo() returns(MyEnum) {};
}`
    const expectedOutput = `contract IMyContract {
  function foo() returns(uint);
}`

    generateInterface(src).should.equal(expectedOutput)
  })

  it('should have option to return only stubs', () => {
    const src = `contract MyContract {
  function foo();
}`
    const expectedOutput = `  function foo();`

    generateInterface(src, { stubsOnly: true }).should.equal(expectedOutput)
  })

  it('should read files from stdin', () => {
    const src = `contract MyContract {
  function foo(uint a) public constant returns(uint) {
  }
}
`
    const expectedOutput = `contract IMyContract {
  function foo(uint a) public constant returns(uint);
}
`
    return spawn('node', ['bin.js'], src).should.eventually.equal(expectedOutput)
  })

  it('should parse inherited contracts from imports', () => {
    const src = `import './test/Imported.sol';

contract MyContract is Imported {
  function foo() {
  }
}
`
    const expectedOutput = `contract IMyContract {

  // inherited
  function imported();

  function foo();
}
`
    return spawn('node', ['bin.js'], src).should.eventually.equal(expectedOutput)
  })

  it('should not parse imported contracts that are not inherited', () => {
    const src = `import './test/Imported.sol';

contract MyContract {
  function foo() {
  }
}
`
    const expectedOutput = `contract IMyContract {
  function foo();
}
`
    return spawn('node', ['bin.js'], src).should.eventually.equal(expectedOutput)
  })

  it('should parse imports with custom import root', () => {
    const src = `import './Imported.sol';

contract MyContract is Imported {
  function foo() {
  }
}
`
    const expectedOutput = `contract IMyContract {

  // inherited
  function imported();

  function foo();
}
`
    return spawn('node', ['bin.js', '--importRoot', __dirname], src).should.eventually.equal(expectedOutput)
  })

})
