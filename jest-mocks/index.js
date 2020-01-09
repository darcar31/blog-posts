import * as thirdPartyUtil from './thirdPartyUtil'
import {doUtil, doUtilWithValue} from './utils'
import { largeFrameworkFunction } from "./largeFramework"

// test to make sure tests work
export function sum(a, b) {
  return a + b;
}

export function myGreatFunction(callback) {
  // do something
  callback()
}

export function myGreatFunctionWithUtil(callback) {
  doUtil()
  callback()
}

export function myGreatFunctionWithUtilReturn(callback) {
  let value = doUtilWithValue()
  callback(value)
}

export function myGreatFunctionWithThirdParty(callback) {
  let value = thirdPartyUtil.commonlyUsedUtilFunction()
  callback(value)
}

export function myGreatFunctionWithLargeFramework(callback) {
  let value = largeFrameworkFunction()
  callback(value)
}
