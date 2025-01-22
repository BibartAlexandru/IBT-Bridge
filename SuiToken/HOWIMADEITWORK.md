Tried compiling the package like here: https://sdk.mystenlabs.com/typedoc/modules/_mysten_sui.html
`sui start`
Got an error and fixed it as shown here https://forums.sui.io/t/sui-client-connection-refused/2346
`sui client envs`

- was on localnet

`sui client switch --env devnet`
`sui move build --dump-bytecode-as-base64 --path . > contract-build.json`

#### To create user account:

- sui client new-address ed25519
- sui keytool list (to see the account's suiAddress )
- sui keytool export --key-identity <alias>
- the private key is shown as exportedPrivateKey
