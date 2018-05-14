var settings = require("./settings.json");
var web3 = new (require("web3"))("http://localhost:8545");
var eth = require("./eth.js");

var lastAddress = "0x8fa93e4885fadd9c47fdb755d372791efce6eaea";

(async () => {
    await web3.eth.personal.unlockAccount(lastAddress, settings.password);
    await web3.eth.sendTransaction({
        from: lastAddress,
        to: settings.address,
        value: web3.utils.toWei("4.17", "ether")
    });
})();
