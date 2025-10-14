#!/usr/bin/env node

import { suiteContext } from "@digitalbazaar/ed25519-signature-2020";
import { Command } from "commander";
import { spawn } from "child_process";
import { createManufacturerWallet } from "../src/wallet.js";
import { getCustomDocumentLoader } from "../src/utils/documentLoader.js";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const program = new Command();

program.command("start-server").action(() => {
  console.log("Starting manufacturer server...");

  const server = spawn("node", ["../web-server/server.js"], {
    stdio: "inherit",
    shell: true,
  });

  server.on("close", (code) => {
    console.log(`Server process exited with code ${code}`);
  });
});

program.command("setup").action(async () => {
  const seed = new Uint8Array(32);
  seed.fill(0x01);

  const serverOptions = {
    host: "localhost",
    storagePath: "../web-server/data",
  };

  const wallet = await createManufacturerWallet(seed, serverOptions);
  console.log("\nManufacturer Wallet created for: ", wallet.did);

  const product = await wallet.createProduct();
  console.log("\nProduct DID Document created: ", product.didDocument);

  const name = "materials";
  const credential = {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    id: "https://example.com/credentials/1872",
    type: ["VerifiableCredential"],
    issuanceDate: "2010-01-01T19:23:24Z",
    issuer: wallet.did,
    credentialSubject: { id: product.did },
  };

  const { documentLoader, addContext } = await getCustomDocumentLoader();
  addContext(suiteContext.CONTEXT_URL, suiteContext.CONTEXT);

  const verifiableCredential = await wallet.createCredential(
    product.did,
    credential,
    name,
    documentLoader,
  );

  console.log(
    "\nProduct Verifiable Credential created: ",
    verifiableCredential,
  );

  console.log("\nManufacturer has been setup!");

  let res = await fetch("https://localhost:443/did", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ did: wallet.did }),
  });
  console.log(await res.json());

  res = await fetch("https://localhost:443/did", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ did: product.did }),
  });
  console.log(await res.json());

  console.log("\nServer now has access to the generated artifacts");
});

program.parse(process.argv);
