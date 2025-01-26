## IBT Bridge 🌉.

Centralized token bridge from Ethereum ↔️ Sui.

### How to use

---

0. Initialize .env variables

   - Inside ./backend-js, there is a .env.example file.
   - Create a file named ".env" and copy the values from the .env.example inside it. You can leave the chain urls as they are but will have to set the deployer private keys, and optionally the contract/package address/id if you already have them deployed.
   - To set the private key of the eth deployer, you can choose any private key displayed when running anvil (see further down).
   - To set the private key of the sui deployer, you can
     do

   ```
   sui start

   //in another terminal
   sui keytool list
   sui keytool export --key-identity ACCOUNT_ALIAS
   ```

   Any account alias displayed by the list command will work.
   The private key is in the field exportedPrivateKey

1. Run the frontend

```
cd frontend/
npm run dev
```

2. Run the backend

```
cd backend-js/
npm run dev
```

3. Run an ethereum local chain

```
anvil // or the path to your anvil executable
```

4. Run a sui chain

```
sui start // or the path to your sui executable
```

In another terminal, you have to set the cli to the devnet network, if you want to use the cli.

```
sui client envs
sui client switch --env devnet
```

You might also need to request SUI from faucet, or use the http://localhost:3000/sui/mintSui/YOUR_SUIADDRESS
GET endpoint to do so.

5. Go to http://localhost:5173

### Requirements

---

1. node.js and npm https://nodejs.org/en/download
2. sui cli https://docs.sui.io/guides/developer/getting-started/sui-install
3. anvil, which is installed with foundry https://book.getfoundry.sh/getting-started/installation

#### Additional information

---

The app has been tested with MetaMask & SuiWallet extensions.
In case you will use SuiWallet, it only runs on Chrome.
