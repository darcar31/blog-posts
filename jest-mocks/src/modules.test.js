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