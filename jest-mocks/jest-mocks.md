# Mocking Functionality in Jest at Different Scopes 

Jest is a robust framework for testing in JavaScript that is jam-packed with features. Within the Jest documentation, lies instructions for mocking out functionality for whatever level of test isolation you are trying to achieve. Getting lost in the docs can be easy; in this article, I walk through how to take advantage of Jest to mock out anything from individual functions within a single test, to entire JavaScript files.

## Mocking A Single Function

### Creating Jest Mocks

#### Individual Standalone Functions
Perhaps you have a function that does some other work before calling a provided callback:

```
function myGreatFunction(callback) {
  // does something
  callback()
}
   
```

To test that this function correctly handles our callback, we are going to need a Jest mock. 

`let mockCallbackFunction = jest.fn()`

In our tests, we can assert that our function calls this mock.

```
it('tests a mock standalone function', () => {
  let mockCallbackFunction = jest.fn()
  doSomething(mockCallbackFunction)
  expect(mockCallbackFunction.mock.calls.length).toBe(1)
})
   
```

The jest mock object holds tons of useful information for assertions, see a more detailed list [here](https://jestjs.io/docs/en/mock-functions#mock-property).


#### Functions on an Object or From an Import
Maybe your method invokes functionality from another file that you can't control directly within the test. 

```
import { doUtil } from './utils'

function myGreatFunctionWithUtil(callback) {
  doUtil()
  callback()
}

```

To isolate testing our callback, we need to mock this additional function by spying on it. The jest.spyOn method also returns a mocked function that we can assert on. 

```
import * as utils from "./utils"

it('tests a function on an object', () => {
  let mockUtilFunction = jest.spyOn(utils, 'doUtil')
  myGreatFunctionWithUtil(() => {})
  expect(mockUtilFunction.mock.calls.length).toBe(1)
})
    
```    

### Mocking Method Functionality 

#### Return Values

With a jest mock, one of the available features is to mock a specific return value. In our running example, what if our util function returns a value to pass to the callback.

```
import { doUtilWithValue } from './utils'

export function myGreatFunctionWithUtilReturn(callback) {
  let value = doUtilWithValue()
  callback(value)
}
   
```

To test the callback is receiving the value from our mocked util function, we need to configure the doUtilWithValue mock to return a value. 

```
import * as utils from "./utils"

it('tests with a return value', () => {
  let mockCallbackFunction = jest.fn()
  jest.spyOn(utils, 'doUtilWithValue').mockReturnValue("fake method return value")

  myGreatFunctionWithUtilReturn(mockCallbackFunction)

  expect(mockCallbackFunction).toHaveBeenCalledWith("fake method return value")
})
``` 

#### Mock Implementation 

Another tool inside a Jest mock is the ability to switch out your entire method implementation.

```
import * as utils from "./utils"

it('tests with a mock impl', () => {
  let mockCallbackFunction = jest.fn()
  jest.spyOn(utils, 'doUtilWithValue').mockImplementation(() => "fake method implementation")

  myGreatFunctionWithUtilReturn(mockCallbackFunction)

  expect(mockCallbackFunction).toHaveBeenCalledWith("fake method implementation")
})
``` 

Instead of returning a particular value, you can swap out the underlying method implementation for another function. It is important to note that without a mock implementation, your original method implementation **is still called**.

## Mocking Modules Within a Test File

Sometimes we have entire modules that we want to mock out for all the tests in a given test file. Near the imports and outside of any test in the file, you can use jest.mock() to mock modules.

```
jest.mock('./utils', () => ({
  doUtil: jest.fn(),
  doUtilWithValue: jest.fn().returnValue("fake utils module")
}))
``` 

The first argument is the module to mock, and the second is a factory that returns the mock implementation.

Notes:
 
1. jest.mock is hoisted above all import statements to ensure the mock happens first.
2. When using default exports, `__esModule: true` must be set on the returned object.
3. Only the test file that calls this jest.mock is affected.

Now my tests inside the same test file will have the mocked utils functionality:

``` 
import {myGreatFunctionWithUtilReturn} from "./functions"

jest.mock('./utils', () => ({
  doUtil: () => {},
  doUtilWithValue: () => "fake utils module"
}))

it('tests with a fake module', () => {
  let mockCallbackFunction = jest.fn()

  myGreatFunctionWithUtilReturn(mockCallbackFunction)

  expect(mockCallbackFunction).toHaveBeenCalledWith("fake utils module")
})
```

## Mocking Modules for the Entire Framework
Perhaps you have a third party module you want to mock for your entire test framework. Jest also provides you a way to do this.

Jest projects most often have a jest configuration object, which may be in your `package.json` or a separate `jest.config.js` file. One of the many properties of this config is `setupFilesAfterEnv`. This property allows you to specify a setup file that runs after the jest environment is installed. 

```
    (jest config object)

    {
      setupFilesAfterEnv: ['./jest.setup.js'],
    }
```

This setup file is just another JavaScript file that runs before any tests execute. Mocks created in this file are applied the entirety of the jest run, not just the one setup file. 

```
    (jest.setup.js)

    jest.mock('thirdPartyUtil', () => ({
      commonlyUsedUtilFunction: jest.fn().returnValue("fake third party module")
    }))

```

The thirdPartyUtil module will now be mocked in every one of your jest tests:

``` 
it('tests setup file mock', () => {
  let mockCallbackFunction = jest.fn()
  
  myGreatFunctionWithThirdParty(mockCallbackFunction)
  
  expect(mockCallbackFunction).toHaveBeenCalledWith("fake third party module")
})
```

 **Important reminder to be a responsible mock owner:**
 
 If you create Jest mocks that exist outside the scope of a single test like either of the module mocks discussed above, it is worth noting that the jest.mock object associated with those mocks is not cleared between test runs unless explicitly done so in an afterEach method or with the clearMocks config options. If you are expecting to make test level assertions on broadly scoped mocks, be aware of how to clear your mocks.

## Mocking Entire Javascript Files

Lastly, you might need to stub out large pieces of functionality like a library or framework. There are relatively limited reasons why you may need to do this, but if so, Jest has a feature for that! Within the same jest, config mentioned earlier; there is a property called `moduleNameMapper`.

ModuleNameMapper is useful for several cases; if you are using file aliases in your app, you may also need this property. But it is also helpful for stubbing out entire files of functionality.

```
    (jest config object)

    {
       moduleNameMapper: {
        largeFramework: "<rootDir>/mocks/largeFrameworkMock.js"
       }
    }
```

Keep in mind that the ordering of this map matters; if multiple regular expressions map to a given file, the first rule is applied. 

This configuration will replace every file that matches the `largeFramework` regular expression with the largeFrameworkMock.js file.

``` 
it('tests regex file mock swap', () => {
  let mockCallbackFunction = jest.fn()
  myGreatFunctionWithLargeFramework(mockCallbackFunction)
  expect(mockCallbackFunction).toHaveBeenCalledWith("fake large framework file")
})
```


## How great!

Like I mentioned before: Jest is a robust testing framework. Like all things vast and powerful, I've found that it can be easy to find one feature that works for most of my cases, and forget to venture out. If you made it this far, hopefully, you learned a new piece of Jest functionality that can help you better create whatever level of testing isolation best fits your app.

Helpful Links:
- [Function Mocking](https://jestjs.io/docs/en/mock-functions)
- [Module Mocking](https://jestjs.io/docs/en/manual-mocks)
- [Jest Configuration Options](https://jestjs.io/docs/en/configuration#modulenamemapper-objectstring-string)
- [See the complete code examples on my github](https://github.com/darcar31/blog-posts/tree/master/jest-mocks)



