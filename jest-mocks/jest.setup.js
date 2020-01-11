jest.mock('./external/thirdPartyUtil', () => ({
  commonlyUsedUtilFunction: () => "fake third party module"
}))