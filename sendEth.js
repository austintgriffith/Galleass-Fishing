var settings = require("./settings.json");
var web3 = new (require("web3"))("http://localhost:8545");
var eth = require("./eth.js");

var lastAddress = "0xdd522d67a5d018c55a8a01d6754e2d4c0fa9a637";

(async () => {
    await web3.eth.personal.unlockAccount(lastAddress, settings.password);
    await web3.eth.sendTransaction({
        from: lastAddress,
        to: settings.address,
        value: web3.utils.toWei("4.19", "ether")
    });
})();
