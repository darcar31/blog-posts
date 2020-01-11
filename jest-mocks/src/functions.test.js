import {myGreatFunction, myGreatFunctionWithUtil, myGreatFunctionWithUtilReturn, myGreatFunctionWithThirdParty, myGreatFunctionWithLargeFramework, sum} from "./functions"
import * as utils from "./utils"

it('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3)
})

it('tests with a mock standalone function', () => {
  let mockCallbackFunction = jest.fn()
  myGreatFunction(mockCallbackFunction)
  expect(mockCallbackFunction.mock.calls.length).toBe(1)
})


it('tests with a function on an object', () => {
  let mockUtilFunction = jest.spyOn(utils, 'doUtil')
  myGreatFunctionWithUtil(() => {})
  expect(mockUtilFunction.mock.calls.length).toBe(1)
})

it('tests with a return value', () => {
  let mockCallbackFunction = jest.fn()
  jest.spyOn(utils, 'doUtilWithValue').mockReturnValue("fake method return value")

  myGreatFunctionWithUtilReturn(mockCallbackFunction)

  expect(mockCallbackFunction).toHaveBeenCalledWith("fake method return value")
})

it('tests with a mock impl', () => {
  let mockCallbackFunction = jest.fn()
  jest.spyOn(utils, 'doUtilWithValue').mockImplementation(() => "fake method implementation" )

  myGreatFunctionWithUtilReturn(mockCallbackFunction)

  expect(mockCallbackFunction).toHaveBeenCalledWith("fake method implementation")
})

it('tests setup file mock', () => {
  let mockCallbackFunction = jest.fn()
  myGreatFunctionWithThirdParty(mockCallbackFunction)
  expect(mockCallbackFunction).toHaveBeenCalledWith("fake third party module")
})

it('tests regex file mock swap', () => {
  let mockCallbackFunction = jest.fn()
  myGreatFunctionWithLargeFramework(mockCallbackFunction)
  expect(mockCallbackFunction).toHaveBeenCalledWith("fake large framework file")
})
