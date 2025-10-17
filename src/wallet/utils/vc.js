import * as vc from '@digitalbazaar/vc';

export const issueCredential = async (credential, suite, documentLoader) => {
  return await vc.issue({ credential, suite, documentLoader });
};
