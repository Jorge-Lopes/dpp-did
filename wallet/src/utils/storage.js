import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const storageManagement = async (storagePath, domain) => {
  const storeDocument = async (document, filePath) => {
    const documentPath = storagePath + filePath;
    const dir = path.dirname(documentPath);

    await mkdir(dir, { recursive: true });
    await writeFile(documentPath, JSON.stringify(document, null, 2), "utf8");
  };

  const getProductPaths = (reference) => {
    const productReference = "/products/" + reference.toString();
    const productHost = domain + productReference;
    const productStoragePath = productReference + "/did.json";

    return { productHost, productStoragePath };
  };

  const getCredentialPaths = (productDid, credentialName) => {
    const productEndpoint = productDid.slice(8).replaceAll(":", "/");
    const credentialHost =
      "https://" + productEndpoint + "/credentials/" + credentialName + ".json";
    const productReference = "/products/" + productEndpoint.slice(-1);
    const credentialStoragePath =
      productReference + `/credentials/${credentialName}.json`;
    const productStoragePath = productReference + "/did.json";

    return { credentialHost, credentialStoragePath, productStoragePath };
  };

  return { storeDocument, getProductPaths, getCredentialPaths };
};
