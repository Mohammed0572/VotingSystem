const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  contracts_directory: "./contracts",
  contracts_build_directory: "../src/contracts/",
  migrations_directory: "./migrations",
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    sepolia: {
      provider: () => new HDWalletProvider(
        process.env.MNEMONIC,
        process.env.SEPOLIA_RPC_URL
      ),
      network_id: 11155111,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  }
}
