const GameContract = artifacts.require("GameContract");
const fs = require('fs');

module.exports = async function (deployer) {
    await deployer.deploy(GameContract);
    const initialFile = `${__dirname}/../build/contracts/GameContract.json`;
    const targetFile = `${__dirname}/../../src/dapp/src/Contracts/GameContract.json`;

    fs.copyFile(initialFile, targetFile, console.log);
};
  