import {doSomethingWithReturn} from "./index"

jest.mock('./utils', () => ({
  doUtil: () => {},
  doUtilWithValue: () => "fake utils module"
}))

it('tests with a return value', () => {
  let mockCallbackFunction = jest.fn()

  doSomethingWithReturn(mockCallbackFunction)

  expect(mockCallbackFunction).toHaveBeenCalledWith("fake utils module")
})