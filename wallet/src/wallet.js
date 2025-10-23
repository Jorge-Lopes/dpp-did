import { generateKeyPair, generateSignSuite } from "./utils/keys.js";
import { createDidKey, createDidWeb, resolveDidDocument } from "./utils/did.js";
import { getCustomDocumentLoader } from "./utils/documentLoader.js";
import { storageManagement } from "./utils/storage.js";
import {
  createProduct as _createProduct,
  createCredential as _createCredential,
  setController,
  setService,
} from "./utils/product.js";

export const createWallet = async (seed, options) => {
  const { method, storagePath, domain } = options;

  const { storeDocument, getProductPaths, getCredentialPaths } =
    await storageManagement(storagePath, domain);

  const keypair = await generateKeyPair(seed);
  const publicKey = keypair.publicKeyMultibase;

  const getDocument = async (did) => {
    return await resolveDidDocument(did);
  };

  if (method === "did:key") {
    const { did, didDocument } = await createDidKey(publicKey);
    await storeDocument(didDocument, "/.well-known/did.json");
    return { keypair, did, didDocument, getDocument };
  }

  const { did, didDocument, methodFor } = await createDidWeb(publicKey, domain);
  const { signSuite, contextSuite } = generateSignSuite(
    keypair,
    didDocument,
    methodFor,
  );

  await storeDocument(didDocument, "/.well-known/did.json");

  const { documentLoader, addContext } = await getCustomDocumentLoader();
  addContext(contextSuite.url, contextSuite.context);

  const productsRegistry = [];

  const createProduct = async () => {
    const { productHost, productStoragePath } = getProductPaths(
      productsRegistry.length,
    );

    const product = await _createProduct(keypair, productHost);
    productsRegistry.push(product.did);

    await storeDocument(product.didDocument, productStoragePath);

    return product;
  };

  const createCredential = async (productDid, credential, credentialName) => {
    credential.issuer = did;
    credential.credentialSubject = { id: did };

    const { verifiableCredential, hash } = await _createCredential(
      credential,
      signSuite,
      documentLoader,
    );

    const didDocument = await getDocument(productDid);
    const { credentialHost, credentialStoragePath, productStoragePath } =
      getCredentialPaths(productDid, credentialName);
    const updatedDidDocument = setService(didDocument, signSuite, {
      domain: credentialHost,
      hash,
    });

    await storeDocument(verifiableCredential, credentialStoragePath);
    await storeDocument(updatedDidDocument, productStoragePath);

    return verifiableCredential;
  };

  // ToDo: change verificationMethod publicKeyMultibase and document storagePath
  const transferProductOwnership = async (did, newController) => {
    const didDocument = await getDocument(did);
    setController(didDocument, signSuite, newController);
  };

  return {
    did,
    didDocument,
    productsRegistry,
    getDocument,
    createProduct,
    createCredential,
    transferProductOwnership,
  };
};
