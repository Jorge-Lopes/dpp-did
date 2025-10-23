import { createDidWeb } from "./did.js";
import { issueCredential } from "./vc.js";
import { createHash } from "crypto";

export const createProduct = async (keypair, domain) => {
  const { publicKeyMultibase, controller } = keypair;

  const { did, didDocument } = await createDidWeb(publicKeyMultibase, domain);

  didDocument["service"] = [];
  didDocument.controller = controller;
  didDocument.verificationMethod[0].controller = controller;

  return { did, didDocument };
};

export const setController = (didDocument, signSuite, newController) => {
  didDocument.controller = newController;
  didDocument.verificationMethod[0].controller = newController;
};

export const setService = (didDocument, signSuite, newService) => {
  const { domain, hash } = newService;

  didDocument.service.push({
    type: "https://www.w3.org/ns/credentials/v2",
    serviceEndpoint: domain,
    hash,
  });

  return didDocument;
};

export const createCredential = async (
  credential,
  signSuite,
  documentLoader,
) => {
  const verifiableCredential = await issueCredential(
    credential,
    signSuite,
    documentLoader,
  );
  const hash = createHash("sha256")
    .update(JSON.stringify(verifiableCredential))
    .digest("hex");

  return { verifiableCredential, hash };
};
