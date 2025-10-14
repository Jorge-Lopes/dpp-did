import express from "express";
import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = 443;
const DATA_DIR = path.join(__dirname, "data");
const CERT_DIR = path.join(__dirname, "certs");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const readJSONFromFile = (filepath) => {
  try {
    if (!fs.existsSync(filepath)) return null;
    const data = fs.readFileSync(filepath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading or parsing ${filepath}:`, err.message);
    return null;
  }
};

// Root endpoint
app.get("/", (_, res) => {
  res.send("Manufacturer server is running.");
});

const didList = [];
app.post("/did", (req, res) => {
  const { did } = req.body;
  didList.push(did);
  res.status(201).json({ message: "DID saved successfully", data: did });
});

app.get("/did", (_, res) => {
  res.json(didList);
});

app.get("/.well-known/did.json", (_, res) => {
  const filePath = path.join(DATA_DIR, "did.json");
  const data = readJSONFromFile(filePath);
  if (!data) return res.status(404).json({ error: "DID file not found" });
  res.json(data);
});

app.get("/products/:id/did.json", (req, res) => {
  const { id } = req.params;
  const filePath = path.join(DATA_DIR, "products", id, "did.json");
  const data = readJSONFromFile(filePath);
  if (!data)
    return res.status(404).json({ error: `DID for product ${id} not found` });
  res.json(data);
});

app.get("/products/:id/credentials/materials.json", (req, res) => {
  const { id } = req.params;
  const filePath = path.join(
    DATA_DIR,
    "products",
    id,
    "credentials",
    "materials.json",
  );
  const data = readJSONFromFile(filePath);
  if (!data)
    return res
      .status(404)
      .json({ error: `Verifiable Credential for product ${id} not found` });
  res.json(data);
});

const options = {
  key: fs.readFileSync(path.join(CERT_DIR, "server.key")),
  cert: fs.readFileSync(path.join(CERT_DIR, "server.cert")),
};

https.createServer(options, app).listen(PORT, () => {
  console.log(`Manufacturer server running at https://localhost:${PORT}`);
});
