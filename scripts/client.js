#!/usr/bin/env node

import { Command } from "commander";
import { createClientWallet } from "../src/wallet.js";
import fetch from "node-fetch";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const program = new Command();

const BASE_URL = "https://localhost:443";

program.command("create-wallet").action(async () => {
  const seed = new Uint8Array(32);
  seed.fill(0x01);
  const wallet = await createClientWallet(seed);
  console.log("Client Wallet created for: ", wallet.did);
});

// --- Fetch Endpoints ---
program.command("get-did-list").action(async () => {
  const res = await fetch(`${BASE_URL}/did`);
  console.log(await res.json());
});

// --- Fetch Product DID ---
program
  .command("get-did")
  .requiredOption("--did <did>")
  .action(async (options) => {
    const did = options.did;

    const seed = new Uint8Array(32);
    seed.fill(0x01);
    const wallet = await createClientWallet(seed);

    const didDocument = await wallet.getDocument(did);
    console.log(didDocument);
  });

program
  .command("get-vc")
  .requiredOption("--vc <vc>")
  .action(async (options) => {
    console.log("LOG: ", options.vc);

    const res = await fetch(options.vc);
    console.log(await res.json());
  });

program.parse(process.argv);
