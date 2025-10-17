import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';
import { Ed25519Signature2020, suiteContext } from '@digitalbazaar/ed25519-signature-2020';

export const generateKeyPair = async (seed) => {
  return await Ed25519VerificationKey2020.generate({ seed });
};

export const generateSignSuite = (keypair, didDocument, methodFor) => {
  const key = methodFor({ purpose: 'assertionMethod' });
  keypair.id = key.id;
  keypair.controller = didDocument.id;

  const signSuite = new Ed25519Signature2020({
    signer: keypair.signer(),
    key: keypair,
  });

  const contextSuite = { url: suiteContext.CONTEXT_URL, context: suiteContext.CONTEXT };

  return { signSuite, contextSuite };
};
