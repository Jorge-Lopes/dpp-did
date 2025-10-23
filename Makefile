system-up:
	mkdir ./wallet/data/
	docker-compose up --build

system-down: clean
	docker-compose down
	
clean:
	rm -rf ./wallet/data/*

business-wallet-init:
	curl -X POST http://localhost:7001/init

business-wallet-product:
	curl -X POST http://localhost:7001/product

business-wallet-credential:
	curl -X POST http://localhost:7001/credential \
  		-H "Content-Type: application/json" \
  		-d '{"did": "$(PRODUCT_DID)", "credential": {"@context": ["https://www.w3.org/2018/credentials/v1"], "id": "https://example.com/credentials/1872", "type": ["VerifiableCredential"], "issuanceDate": "2010-01-01T19:23:24Z"}, "name": "materials"}'

client-wallet-init:
	curl -X POST http://localhost:7002/init

client-wallet-get-did:
	curl -X POST http://localhost:7002/did \
		-H "Content-Type: application/json" \
		-d '{"did":"$(DID)"}'

client-wallet-get-credential:
	curl -k https://localhost:7003$(PATH)

install:
	cd business-server && npm install
	cd wallet && npm install

