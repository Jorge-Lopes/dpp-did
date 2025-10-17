const mockCredential = {
  '@context': ['https://www.w3.org/2018/credentials/v1'],
  id: 'https://example.com/credentials/1872',
  type: ['VerifiableCredential'],
  issuanceDate: '2010-01-01T19:23:24Z',
};

export const getMockMaterialsCredential = (issuer) => {
  const name = 'materials';
  const credential = mockCredential;
  credential.issuer = issuer;
  credential.credentialSubject = { id: issuer };

  return { credential, name };
};
