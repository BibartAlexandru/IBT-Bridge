### Final IBT project.

---

How to use:

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
sui start
```

You might also need to request SUI from faucet, or use the http://localhost:3000/sui/mintSui/YOUR_suiAddress
endpoint to do so. You have to be on the devnet.

5. Go to http://localhost:5173

#### Requirements

---

1. node.js and npm https://nodejs.org/en/download
2. sui cli https://docs.sui.io/guides/developer/getting-started/sui-install
3. anvil, which is installed with foundry https://book.getfoundry.sh/getting-started/installation

#### Additional information

---

The app has been tested with MetaMask & SuiWallet extensions.
In case you will use SuiWallet, it only runs on Chrome.
