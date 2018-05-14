var web3 = new (require("web3"))("http://localhost:8545");

var user = {};
var contracts = {};
var galleass = {};
async function getContract(name, target) {
    contracts[target] = await contracts.galleass.methods.getContract(web3.utils.fromAscii(name)).call();
    contracts[target] = new web3.eth.Contract(require("./abis/" + target + ".json"), contracts[target], {
        gasPrice: "10000000000",
        gas: "250000"
    });
}

var ships, ship;
async function start(settings, callback) {
    user.address = settings.address;
    user.password = settings.password;
    
    galleass.address = settings.galleass;
    galleass.creationBlock = settings.creationBlock;
    
    contracts.galleass = new web3.eth.Contract(require("./abis/galleass.json"), settings.galleass, {
        gasPrice: "10000000000"
    });
    await getContract("Dogger", "ship");
    await getContract("Harbor", "harbor");
    await getContract("Sea", "sea");
    await getContract("Fishmonger", "fishmonger");
    
    var ships = await contracts.ship.methods.tokensOfOwner(user.address).call();
    ships = [0];
    if (ships.length > 0) {
        ship = ships[0];
        await callback();
        return;
    }
    
    var rl = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout
    });
}

start(require("./settings.json"), async function() {console.log((await contracts.sea.methods.inRangeToDisembark(user.address).call()));});