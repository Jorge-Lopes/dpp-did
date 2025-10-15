import { defaultDocumentLoader } from '@digitalbazaar/vc';
import { driver } from '@digitalbazaar/did-method-web';
import pkg from 'jsonld-signatures';

const { extendContextLoader } = pkg;
const didWebDriver = driver();

export const getCustomDocumentLoader = async () => {
  const remoteDocuments = new Map();

  const addContext = (url, context) => {
    remoteDocuments.set(url, context);
  };

  const documentLoader = extendContextLoader(async (url) => {
    const didDocument = remoteDocuments.get(url);
    if (didDocument) {
      return {
        contextUrl: null,
        document: didDocument,
        documentUrl: url,
      };
    }

    if (url.startsWith('did:web:')) {
      const didDocument = await didWebDriver.get({ url });
      return {
        contextUrl: null,
        documentUrl: url,
        document: didDocument,
      };
    }

    return defaultDocumentLoader(url);
  });

  return { documentLoader, addContext };
};
