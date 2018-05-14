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

var ship;
module.exports = {
    web3: web3,
    
    getBalance: async () => {
        return web3.utils.fromWei(await web3.eth.getBalance(user.address));
    },
    
    start: async(settings) => {
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
        if (ships.length > 0) {
            ship = ships[0];
            return;
        }
        
        var rl = require("readline").createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        rl.question("You must have a ship in your inventory to continue. Do I have permission to buy a ship for you (Yes/No)?\r\n\r\nIf you have already bought a ship, please close this (Ctrl^C) and wait.\r\n", async (answer) => {
            if (answer.substr(0, 1).toLowerCase() !== "y") {
                console.log("I have not bought a ship for you. Please come back later!");
                return;
            }
            
            console.log("Buying a ship...");
            
            await web3.eth.personal.unlockAccount(user.address, user.password);
            await contracts.harbor.methods.buyShip(web3.utils.fromAscii("Dogger")).send({
                from: user.address,
                value: await contracts.harbor.methods.currentPrice(web3.utils.fromAscii("Dogger")).call()
            })
            
            var ships = await contracts.ship.methods.tokensOfOwner(user.address).call();
            if (ships.length > 0) {
                ship = ships[0];
                return;
            } else {
                console.log("I have bought a ship for you. Please restart this bot. Your ship SHOULD (but may not) be ready now!");
            }
        });
    },
    
    embark: async(callback) => {
        var ships = await contracts.ship.methods.tokensOfOwner(user.address).call();
        ship = parseInt(ships[0]);
        await web3.eth.personal.unlockAccount(user.address, user.password);
        await contracts.sea.methods.embark(ship).send({
            from: user.address
        });
    },
    
    getFish: async() => {
        return await contracts.sea.getPastEvents("Fish", {
            fromBlock: 1000000,
            toBlock: "latest"
        });
    },
    
    getCatches: async() => {
        return await contracts.sea.getPastEvents("Catch", {
            fromBlock: 1000000,
            toBlock: "latest"
        });
    },
    
    getShip: async() => {
        var ethShip = await contracts.sea.methods.ships(user.address).call({
            from: user.address
        });
        var shipLocation = await contracts.sea.methods.shipLocation(user.address).call({
            from: user.address
        });
        ethShip.blockNumber = parseInt(ethShip.blockNumber);
        ethShip.location = parseInt(ethShip.location);
        return {
            id: ethShip.id,
            floating: ethShip.floating,
            sailing: ethShip.sailing,
            direction: ethShip.direction,
            location: parseInt(shipLocation),
            fishing: ethShip.fishing
        }
    },
    
    getHarborLocation: async() => {
        return parseInt(await contracts.sea.methods.getHarborLocation().call());
    },
    
    getFishLocation: async(id) => {
        return await contracts.sea.methods.fishLocation(id).call();
    },
    
    setSail: async(direction) => {
        await web3.eth.personal.unlockAccount(user.address, user.password);
        await contracts.sea.methods.setSail(direction).send({
            from: user.address
        });
    },
    
    dropAnchor: async(callback) => {
        await web3.eth.personal.unlockAccount(user.address, user.password);
        await contracts.sea.methods.dropAnchor().send({
            from: user.address
        });
        if (callback) {
            callback();
        }
    },
    
    castLine: async(hash) => {
        await web3.eth.personal.unlockAccount(user.address, user.password);
        try { //Web3 hates castLine.
            await contracts.sea.methods.castLine(hash).send({
                from: user.address
            });
        }catch(e){}
    },
    
    reelIn: async(id, bait, callback) => {
        await web3.eth.personal.unlockAccount(user.address, user.password);
        return (await contracts.sea.methods.reelIn(id, bait).send({
            from: user.address
        })).events.Attempt.returnValues.result;
    },
    
    getSpecies: async(fish) => {
        return (await contracts.sea.methods.fish(fish).call());
    },
    
    sellFish: async(species) => {
        await web3.eth.personal.unlockAccount(user.address, user.password);
        await contracts.fishmonger.methods.sellFish(species, 1).send({
            from: user.address
        });
    },
    
    disembark: async(id) => {
        await web3.eth.personal.unlockAccount(user.address, user.password);
        await contracts.sea.methods.disembark(ship).send({
            from: user.address
        });
    }
}
