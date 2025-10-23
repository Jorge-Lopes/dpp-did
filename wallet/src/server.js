import express from "express";
import { createWallet } from "./wallet.js";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
app.use(express.json());

const ROLE = process.env.ROLE || "Business";
const PORT = process.env.PORT || 7000;
const STORAGE_PATH = process.env.STORAGE_PATH || "./data";
const DOMAIN = process.env.DOMAIN || `localhost:7003`;

let wallet;

const verifyWallet = (res) => {
  if (!wallet) {
    return res.status(400).json({ error: "Wallet not initialized" });
  }
};

const isBusiness = (res) => {
  if (!ROLE === "Business") {
    return res
      .status(400)
      .json({ error: `${ROLE} wallets do not have this functionality` });
  }
};

app.post("/init", async (req, res) => {
  const seed = new Uint8Array(32).fill(0x01);
  let options;

  if (ROLE === "Business") {
    options = {
      method: "did:web",
      storagePath: STORAGE_PATH,
      domain: DOMAIN,
    };
  } else if (ROLE === "Client") {
    options = {
      method: "did:key",
      storagePath: STORAGE_PATH,
    };
  }

  try {
    wallet = await createWallet(seed, options);
    res.json(wallet.did);
  } catch (error) {
    console.error("Wallet initialization error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/product", async (req, res) => {
  try {
    verifyWallet(res);
    isBusiness(res);

    const product = await wallet.createProduct();
    res.json(product);
  } catch (error) {
    console.error("Product creation error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/credential", async (req, res) => {
  try {
    verifyWallet(res);
    isBusiness(res);

    const { did, credential, name } = req.body;

    const vc = await wallet.createCredential(did, credential, name);
    res.json(vc);
  } catch (error) {
    console.error("Credential creation error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/ownership", async (req, res) => {
  try {
    verifyWallet(res);
    isBusiness(res);

    const { did, newController } = req.body;
    const updatedDoc = await wallet.transferProductOwnership(
      did,
      newController,
    );
    res.json(updatedDoc);
  } catch (error) {
    console.error("Ownership transfer error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/did", async (req, res) => {
  try {
    verifyWallet(res);

    const { did } = req.body;
    const document = await wallet.getDocument(did);
    res.json(document);
  } catch (error) {
    console.error("DID resolution error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`${ROLE} wallet running at http://localhost:${PORT}`);
});
