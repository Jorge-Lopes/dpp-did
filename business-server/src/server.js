import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import fs from "fs";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8000;

app.use(
  express.static(path.join(__dirname, "../data/business/"), {
    dotfiles: "allow",
  }),
);

const options = {
  key: fs.readFileSync(path.join(__dirname, "certs/localhost-key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "certs/localhost.pem")),
};

const server = https.createServer(options, app);

server.listen(PORT, () => {
  console.log(`App listening on https://localhost:${PORT}`);
});
