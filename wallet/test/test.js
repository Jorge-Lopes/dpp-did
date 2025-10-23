import { createHash } from "crypto";
import { createWallet } from "../src/wallet.js";
import { getMockMaterialsCredential } from "./utils/mockData.js";
import { stubRequest } from "./utils/stub.js";

describe("happy path", () => {
  let stub;
  let businessWallet;
  let clientWallet;
  let productDocument;
  let verifiableCredential;

  afterEach(() => {
    if (stub) {
      stub.restore();
    }
  });

  test("business create digital wallet", async () => {
    const seed = new Uint8Array(32);
    seed.fill(0x01);

    const options = {
      method: "did:web",
      storagePath: "test/data/business",
      domain: "example.com",
    };

    businessWallet = await createWallet(seed, options);
    expect(businessWallet).toBeDefined();
  });

  test("business create new product", async () => {
    const product = await businessWallet.createProduct();
    productDocument = product.didDocument;
    expect(product).toBeDefined();
  });

  test("business issue new credential for product", async () => {
    stub = stubRequest({
      url: "https://example.com/products/0/did.json",
      data: productDocument,
    });

    const productDid = businessWallet.productsRegistry[0];
    const productDidDocument = await businessWallet.getDocument(productDid);
    expect(productDidDocument.service).toStrictEqual([]);

    productDocument = productDidDocument;

    const { credential, name } = getMockMaterialsCredential(businessWallet.did);
    verifiableCredential = await businessWallet.createCredential(
      productDid,
      credential,
      name,
    );
    expect(verifiableCredential).toBeDefined();

    const updatedProductDocument = await businessWallet.getDocument(productDid);

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
    expect(updatedProductDocument.service).toStrictEqual(expectedService);
  });

  test("client create digital wallet", async () => {
    const seed = new Uint8Array(32);
    seed.fill(0x00);

    const options = {
      method: "did:key",
      storagePath: "test/data/client",
    };

    clientWallet = await createWallet(seed, options);
    expect(clientWallet).toBeDefined();
  });

  test("client get product DID Document", async () => {
    stub = stubRequest({
      url: "https://example.com/products/0/did.json",
      data: productDocument,
    });

    //Client get product DID from data carrier
    const scannedDID = "did:web:example.com:products:0";

    const document = await clientWallet.getDocument(scannedDID);
    expect(document).toBeDefined();
    expect(document).toStrictEqual(productDocument);
  });

  test("client buys", async () => {
    stub = stubRequest({
      url: "https://example.com/products/0/did.json",
      data: productDocument,
    });

    const productDid = businessWallet.productsRegistry[0];

    let document = await businessWallet.getDocument(productDid);
    expect(document.controller).toStrictEqual(businessWallet.did);

    await businessWallet.transferProductOwnership(productDid, clientWallet.did);
    document = await businessWallet.getDocument(productDid);
    expect(document.controller).toStrictEqual(clientWallet.did);
  });
});
