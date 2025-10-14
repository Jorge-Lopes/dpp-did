import { createDidWeb } from "./did.js";
import { issueCredential } from "./vc.js";
import { createHash } from "crypto";

export const createNewProduct = async (publicKey, host) => {
  const { did, didDocument } = await createDidWeb(publicKey, host);
  didDocument["service"] = [];

  const setController = (controller) => {
    didDocument.controller = controller;
    didDocument.verificationMethod[0].controller = controller;
  };

  const addCredential = async (
    credential,
    signSuite,
    documentLoader,
    endpoint,
  ) => {
    const verifiableCredential = await issueCredential(
      credential,
      signSuite,
      documentLoader,
    );
    const hash = createHash("sha256")
      .update(JSON.stringify(verifiableCredential))
      .digest("hex");

    didDocument.service.push({
      type: "https://www.w3.org/ns/credentials/v2",
      serviceEndpoint: endpoint,
      hash,
    });
    return verifiableCredential;
  };

  return { did, didDocument, setController, addCredential };
};
