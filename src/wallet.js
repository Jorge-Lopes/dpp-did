import { Ed25519VerificationKey2020 } from "@digitalbazaar/ed25519-verification-key-2020";
import { Ed25519Signature2020 } from "@digitalbazaar/ed25519-signature-2020";
import { createDidKey, createDidWeb, getDidDocument } from "./did.js";
import { createNewProduct } from "./product.js";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const storeDocument = async (document, filePath) => {
  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, JSON.stringify(document, null, 2), "utf8");
};

export const createManufacturerWallet = async (seed, serverOptions) => {
  const { host, storagePath = "./temp-files" } = serverOptions;

  const keypair = await Ed25519VerificationKey2020.generate({ seed });

  const { did, didDocument, methodFor } = await createDidWeb(
    keypair.publicKeyMultibase,
    host,
  );
  const documentPath = storagePath + "/did.json";
  await storeDocument(didDocument, documentPath);

  const key = methodFor({ purpose: "assertionMethod" });
  keypair.id = key.id;
  keypair.controller = didDocument.id;

  const signSuite = new Ed25519Signature2020({
    signer: keypair.signer(),
    key: keypair,
  });

  const products = new Map();

  const createProduct = async () => {
    const productPublicKey = keypair.publicKeyMultibase;
    const productReference = "/products/" + products.size.toString();
    const productHost = host + productReference;

    const product = await createNewProduct(productPublicKey, productHost);

    product.setController(keypair.controller);
    products.set(product.did, product);

    const productStoragePath = storagePath + productReference + "/did.json";
    await storeDocument(product.didDocument, productStoragePath);

    return product;
  };

  const createCredential = async (did, credential, name, documentLoader) => {
    let product = products.get(did);
    const productEndpoint = product.did.slice(8).replaceAll(":", "/");
    const endpoint =
      "https://" + productEndpoint + "/credentials/" + name + ".json";

    const verifiableCredential = await product.addCredential(
      credential,
      signSuite,
      documentLoader,
      endpoint,
    );

    const productReference = "/products/" + productEndpoint.slice(-1);
    const credentialStoragePath =
      storagePath + productReference + `/credentials/${name}.json`;

    await storeDocument(verifiableCredential, credentialStoragePath);

    // update stored product DID Document file
    product = products.get(did);
    const productStoragePath = storagePath + productReference + "/did.json";
    await storeDocument(product.didDocument, productStoragePath);

    return verifiableCredential;
  };

  return { did, didDocument, products, createProduct, createCredential };
};

export const createClientWallet = async (seed) => {
  const keypair = await Ed25519VerificationKey2020.generate({ seed });
  const { did, didDocument } = await createDidKey(keypair.publicKeyMultibase);

  const getDocument = async (did) => {
    return await getDidDocument(did);
  };

  return { did, didDocument, getDocument };
};
