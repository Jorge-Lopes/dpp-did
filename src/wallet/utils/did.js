import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';
import { driver as DidKeyDriver } from '@digitalbazaar/did-method-key';
import { driver as DidWebDriver } from '@digitalbazaar/did-method-web';

export const createDidKey = async (publicKey) => {
  const driver = new DidKeyDriver();
  const did = 'did:key:' + publicKey;

  const multibaseMultikeyHeader = did.slice(8, 12);
  const fromMultibase = Ed25519VerificationKey2020.from;
  driver.use({ multibaseMultikeyHeader, fromMultibase });

  const didDocument = await driver.get({ did });

  return { did, didDocument };
};

// did:web
export const createDidWeb = async (publicKey, host) => {
  const driver = new DidWebDriver();

  const multibaseMultikeyHeader = publicKey.slice(0, 4);
  const fromMultibase = Ed25519VerificationKey2020.from;
  driver.use({ multibaseMultikeyHeader, fromMultibase });

  const keyPairForVerification = await Ed25519VerificationKey2020.from({
    publicKeyMultibase: publicKey,
  });

  const { didDocument, methodFor } = await driver.fromKeyPair({
    url: 'https://' + host,
    verificationKeyPair: keyPairForVerification,
  });

  const did = didDocument.id;

  return { did, didDocument, methodFor };
};

export const resolveDidDocument = async (did) => {
  const driver = new DidWebDriver();
  return await driver.get({ did: did });
};
