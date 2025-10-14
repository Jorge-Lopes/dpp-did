## Happy Path

### Actors

- Manufacturer
- Client

### Components

- Manufacturer Wallet
- Manufacturer DID (did:web)
- Manufacturer web domain (local server)
- Client Wallet
- Client DID (did:key)
- Product DID (did:web)
- Product Verifiable Credential(s)
- Verifiable Data Registry

### Sequence Diagram

```mermaid
sequenceDiagram
    participant M as Manufacturer (Wallet)
    participant D as Product DID (DID Document)
    participant R as Registry
    participant C as Client (Wallet)

    %% --- Product Creation ---
    M->>D: Generate Product DID (Manufacturer DID as controller)
    M->>M: Issue VC with product data (Product DID as subject)
    M->>D: Anchor VC to DID document
    M->>R: Register DID document

    %% --- Product Discovery ---
    Note over M,C: Client researches product
    C->>R: Fetch Product DID document
    R-->>C: DID Document (with controller + VC hashes)
    C->>M: Request product VCs
    M-->>C: Send Product VC
    C->>C: Verify VC integrity using anchored hash

    %% --- Ownership Transfer ---
    Note over M,C: Client buys product
    M->>D: Update DID controller field to Client DID (anonymous DID)
    C->>D: Add public keys (confirm ownership)
    M->>C: Transfer Product VC to Client wallet

```
