var web3 = new (require("web3"))("http://localhost:8545");

var user = {};
var contracts = {};
var galleass = {};
async function getContract(name, target) {
    try {
        contracts[target] = await contracts.galleass.methods.getContract(web3.utils.fromAscii(name)).call();
        contracts[target] = new web3.eth.Contract(require("./abis/" + target + ".json"), contracts[target], {
            gasPrice: "10000000000",
            gas: "200000"
        });
    } catch(e) {
        console.log(e);
    }
}

var ship;
module.exports = {
    web3: web3,
    
    start: async(settings, callback) => {
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
        console.log(JSON.stringify(ships));
        if (ships.length > 0) {
            ship = ships[0];
            await callback();
            return;
        }
        
        var rl = require("readline").createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        rl.question("You must have a ship in your inventory to continue. Do I have permission to buy a ship for you (Yes/No)?\r\n\r\nIf you have already bought a ship, please close this and wait.\r\n", async (answer) => {
            if (answer.substr(0, 1).toLowerCase() !== "y") {
                console.log("I have not bought a ship for you. Please come back later!");
                return;
            }
            
            await web3.eth.personal.unlockAccount(user.address, user.password);
            await contracts.harbor.methods.buyShip(web3.utils.fromAscii("Dogger")).send({
                from: user.address,
                value: await contracts.harbor.methods.currentPrice(web3.utils.fromAscii("Dogger")).call()
            })
            
            console.log("I have bought a ship for you. Please come back soon! Your ship should be ready soon!");
            rl.close();
        });
    },
    
    embark: async(callback) => {
        var ships = await contracts.ship.methods.tokensOfOwner(user.address).call();
        ship = parseInt(ships[0]);
        await web3.eth.personal.unlockAccount(user.address, user.password);
        await contracts.sea.methods.embark(ship).send({
            from: user.address
        });
        callback();
    },
    
    getFish: async() => {
        return await contracts.sea.getPastEvents("Fish", {
            fromBlock: 2500000,
            toBlock: "latest"
        });
    },
    
    getCatches: async() => {
        return await contracts.sea.getPastEvents("Catch", {
            fromBlock: 2500000,
            toBlock: "latest"
        });
    },
    
    getShip: async() => {
        var ethShip = await contracts.sea.methods.ships(user.address).call();
        return {
            id: ethShip.id,
            location: ethShip.location,
            sailing: ethShip.sailing,
            direction: ethShip.direction,
            fishing: ethShip.fishing
        }
    },
    
    getHarborLocation: async() => {
        return await contracts.sea.methods.getHarborLocation().call();
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
        callback();
    },
    
    castLine: async(hash, callback) => {
        await web3.eth.personal.unlockAccount(user.address, user.password);
        await contracts.sea.methods.castLine(hash).send({
            from: user.address
        });
        callback();
    },
    
    reelIn: async(id, bait, callback) => {
        var res = await contracts.sea.methods.reelIn(id, bait).call({
            from: user.address
        });
        await web3.eth.personal.unlockAccount(user.address, user.password);
        await contracts.sea.methods.reelIn(id, bait).send({
            from: user.address
        });
        callback(res);
    },
    
    getSpecies: async(fish) => {
        return await contracts.sea.methods.fish(fish).call();
    },
    
    sellFish: async(species) => {
        await web3.eth.personal.unlockAccount(user.address, user.password);
        await contracts.fishmonger.methods.sellFish(species, 1).send({
            from: user.address
        });
    },
    
    nearHarbor: async() => {
        return await contracts.sea.methods.inRangeToDisembark(user.address).call();
    },
    
    disembark: async(id) => {
        await web3.eth.personal.unlockAccount(user.address, user.password);
        await contracts.sea.methods.disembark(ship).send({
            from: user.address
        });
    }
}
