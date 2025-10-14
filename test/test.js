import { suiteContext } from "@digitalbazaar/ed25519-signature-2020";
import { createHash } from "crypto";
import { createManufacturerWallet, createClientWallet } from "../src/wallet.js";
import { getCustomDocumentLoader } from "../src/utils/documentLoader.js";
import { mockCredential } from "./utils/mockData.js";
import { stubRequest } from "./utils/stub.js";

describe("happy path", () => {
  let stub;
  let manufacturerWallet;
  let clientWallet;
  let productDocument;
  let verifiableCredential;

  afterEach(() => {
    if (stub) {
      stub.restore();
    }
  });

  test("manufacturer create digital wallet", async () => {
    const seed = new Uint8Array(32);
    seed.fill(0x01);

    const serverOptions = {
      storagePath: "test/wallets/manufacturer",
      host: "example.com",
    };

    manufacturerWallet = await createManufacturerWallet(seed, serverOptions);
    expect(manufacturerWallet).toBeDefined();
  });

  test("manufacturer create new product", async () => {
    const product = await manufacturerWallet.createProduct();
    expect(product).toBeDefined();
  });

  test("manufacturer issue new credential for product", async () => {
    const [productDid, product] = manufacturerWallet.products
      .entries()
      .next().value;
    expect(product.didDocument.service).toStrictEqual([]);

    productDocument = product.didDocument;

    const name = "materials";
    const credential = mockCredential;
    credential.issuer = manufacturerWallet.did;
    credential.credentialSubject = { id: manufacturerWallet.did };

    const { documentLoader, addContext } = await getCustomDocumentLoader();
    addContext(suiteContext.CONTEXT_URL, suiteContext.CONTEXT);

    verifiableCredential = await manufacturerWallet.createCredential(
      productDid,
      credential,
      name,
      documentLoader,
    );
    expect(verifiableCredential).toBeDefined();

    const updatedProduct = manufacturerWallet.products.get(productDid);

    const hash = createHash("sha256")
      .update(JSON.stringify(verifiableCredential))
      .digest("hex");
    const expectedService = [
      {
        type: "https://www.w3.org/ns/credentials/v2",
        serviceEndpoint:
          "https://example.com/products/0/credentials/materials.json",
        hash,
      },
    ];
    expect(updatedProduct.didDocument.service).toStrictEqual(expectedService);
  });

  test("client create digital wallet", async () => {
    const seed = new Uint8Array(32);
    seed.fill(0x00);

    clientWallet = await createClientWallet(seed);
    expect(clientWallet).toBeDefined();
  });

  test("client get product DID document and buys product", async () => {
    stub = stubRequest({
      url: "https://example.com/products/0/did.json",
      data: productDocument,
    });

    let document = await clientWallet.getDocument(productDocument.id);
    expect(document).toBeDefined();
    expect(document.controller).toBe(manufacturerWallet.did);

    // manufacturer set new product DID controller
    const [, product] = manufacturerWallet.products.entries().next().value;
    expect(document).toBe(product.didDocument);
    product.setController(clientWallet.did);

    document = await clientWallet.getDocument(productDocument.id);
    expect(document.controller).toBe(clientWallet.did);
  });
});
