import _ from './thirdPartyUtil'

jest.mock('./thirdPartyUtil', () => ({
  commonlyUsedUtilFunction: () => "fake third party module"
}))