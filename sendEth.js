var settings = require("./settings.json");
var web3 = new (require("web3"))("http://localhost:8545");
var eth = require("./eth.js");

var lastAddress = "0x7022f8ab92b1dc4756909423dee55a7131e9d771";

(async () => {
    await web3.eth.personal.unlockAccount(lastAddress, settings.password);
    await web3.eth.sendTransaction({
        from: lastAddress,
        to: settings.address,
        value: web3.utils.toWei("0.38", "ether")
    });
})();
