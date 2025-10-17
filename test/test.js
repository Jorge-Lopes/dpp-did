import { createHash } from 'crypto';
import { createWallet } from '../src/wallet.js';
import { getMockMaterialsCredential } from './utils/mockData.js';
import { stubRequest } from './utils/stub.js';

describe('happy path', () => {
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

  test('manufacturer create digital wallet', async () => {
    const seed = new Uint8Array(32);
    seed.fill(0x01);

    const options = {
      method: 'web',
      storagePath: 'test/wallets/manufacturer',
      host: 'example.com',
    };

    manufacturerWallet = await createWallet(seed, options);
    expect(manufacturerWallet).toBeDefined();
  });

  test('manufacturer create new product', async () => {
    const product = await manufacturerWallet.createProduct();
    productDocument = product.didDocument;
    expect(product).toBeDefined();
  });

  test('manufacturer issue new credential for product', async () => {
    stub = stubRequest({
      url: 'https://example.com/products/0/did.json',
      data: productDocument,
    });

    const productDid = manufacturerWallet.productsRegistry[0];
    const productDidDocument = await manufacturerWallet.getDocument(productDid);
    expect(productDidDocument.service).toStrictEqual([]);

    productDocument = productDidDocument;

    const { credential, name } = getMockMaterialsCredential(manufacturerWallet.did);
    verifiableCredential = await manufacturerWallet.createCredential(productDid, credential, name);
    expect(verifiableCredential).toBeDefined();

    const updatedProductDocument = await manufacturerWallet.getDocument(productDid);

    const hash = createHash('sha256').update(JSON.stringify(verifiableCredential)).digest('hex');
    const expectedService = [
      {
        type: 'https://www.w3.org/ns/credentials/v2',
        serviceEndpoint: 'https://example.com/products/0/credentials/materials.json',
        hash,
      },
    ];
    expect(updatedProductDocument.service).toStrictEqual(expectedService);
  });

  test('client create digital wallet', async () => {
    const seed = new Uint8Array(32);
    seed.fill(0x00);

    const options = {
      method: 'key',
      storagePath: 'test/wallets/client',
    };

    clientWallet = await createWallet(seed, options);
    expect(clientWallet).toBeDefined();
  });

  test('client get product DID Document', async () => {
    stub = stubRequest({
      url: 'https://example.com/products/0/did.json',
      data: productDocument,
    });

    //Client get product DID from data carrier
    const scannedDID = 'did:web:example.com:products:0';

    const document = await clientWallet.getDocument(scannedDID);
    expect(document).toBeDefined();
    expect(document).toStrictEqual(productDocument);
  });

  test('client buys', async () => {
    stub = stubRequest({
      url: 'https://example.com/products/0/did.json',
      data: productDocument,
    });

    const productDid = manufacturerWallet.productsRegistry[0];

    let document = await manufacturerWallet.getDocument(productDid);
    expect(document.controller).toStrictEqual(manufacturerWallet.did);

    await manufacturerWallet.transferProductOwnership(productDid, clientWallet.did);
    document = await manufacturerWallet.getDocument(productDid);
    expect(document.controller).toStrictEqual(clientWallet.did);
  });
});
