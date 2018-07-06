var web3 = new (require("web3"))("http://localhost:8545");

var user = {};
var contracts = {};
var galleass = {};
async function getContract(name, target) {
    contracts[target] = await contracts.galleass.methods.getContract(web3.utils.fromAscii(name)).call();
    contracts[target] = new web3.eth.Contract(require("./abis/" + target + ".json"), contracts[target], {
        gasPrice: "10000000000",
        gas: "500000"
    });
}

var dogger;
module.exports = {
    web3: web3,

    getBalance: async () => {
        return parseFloat(web3.utils.fromWei(await web3.eth.getBalance(user.address)));
    },



    start: async(settings, callback) => {

        if(!settings.address){
          //if they don't define a user let's grab the 4th one
          settings.password=""
          let accounts = await web3.eth.getAccounts()
          settings.address = accounts[3]
        }

        user.address = settings.address;
        user.password = settings.password;


        galleass.address = settings.galleass;
        galleass.creationBlock = settings.creationBlock;

        contracts.galleass = new web3.eth.Contract(require("./abis/galleass.json"), galleass.address, {
            gasPrice: "10000000000"
        });
        await getContract("Dogger", "dogger");
        await getContract("Harbor", "harbor");
        await getContract("Bay", "bay");
        await getContract("Fishmonger", "fishmonger");
        await getContract("Catfish", "catfish");
        await getContract("Dangler", "dangler");
        await getContract("Pinner", "pinner");
        await getContract("Redbass", "redbass");
        await getContract("Snark", "snark");
        await getContract("Copper", "copper");
        await getContract("Land", "land");
        await getContract("LandLib", "landlib");

        console.log("Reading land contract for current location...")
        settings.landX = await contracts.land.methods.mainX().call();
        settings.landY = await contracts.land.methods.mainY().call();

        let harborTileType = await contracts.landlib.methods.tileTypes(web3.utils.fromAscii("Harbor")).call();
        let fishmongerTileType = await contracts.landlib.methods.tileTypes(web3.utils.fromAscii("Fishmonger")).call();

        for(let tile=0;tile<18;tile++){
          let atThisTile = await contracts.land.methods.tileTypeAt(settings.landX,settings.landY,tile).call();
          if(atThisTile == harborTileType){
            settings.harborTile = tile
          }else if(atThisTile == fishmongerTileType){
            settings.fishmongerTile = tile
          }
        }
        console.log(settings)

        var doggers = await contracts.dogger.methods.tokensOfOwner(user.address).call();
          console.log("doggers:",doggers)
        if (doggers.length > 0) {
            dogger = doggers[0];
            callback();
            return;
        }

        if(doggers.length>0){
          callback();
        }else{
          console.log("Buying a dogger...");

          await web3.eth.personal.unlockAccount(user.address, user.password);
          await contracts.harbor.methods.buyShip(settings.landX,settings.landY,settings.harborTile,web3.utils.fromAscii("Dogger")).send({
              from: user.address,
              value: await contracts.harbor.methods.currentPrice(settings.landX,settings.landY,settings.harborTile,web3.utils.fromAscii("Dogger")).call()
          })

          var doggers = await contracts.dogger.methods.tokensOfOwner(user.address).call();
          if (doggers.length > 0) {
              dogger = doggers[0];
              callback();
              return;
          }
        }

        /*
        var rl = require("readline").createInterface({
          input: process.stdin,
          output: process.stdout
        });

        rl.question("You must have a dogger in your inventory to continue. Do I have permission to buy a dogger for you (Yes/No)?\r\n\r\nIf you have already bought a dogger, please close this (Ctrl^C) and wait.\r\n", async (answer) => {
            if (answer.substr(0, 1).toLowerCase() !== "y") {
                console.log("I have not bought a dogger for you. Please come back later!");
                return;
            }

            console.log("Buying a dogger...");

            await web3.eth.personal.unlockAccount(user.address, user.password);
            await contracts.harbor.methods.buyShip(settings.landX,settings.landY,settings.harborTile,web3.utils.fromAscii("Dogger")).send({
                from: user.address,
                value: await contracts.harbor.methods.currentPrice(settings.landX,settings.landY,settings.harborTile,web3.utils.fromAscii("Dogger")).call()
            })

            var doggers = await contracts.dogger.methods.tokensOfOwner(user.address).call();
            if (doggers.length > 0) {
                dogger = doggers[0];
                await callback();
            } else {
                console.log("I have bought a dogger for you. Please restart this bot. Your dogger SHOULD (but may not) be ready now!");
            }
        });
        */
    },

    embark: async(settings) => {
        var doggers = await contracts.dogger.methods.tokensOfOwner(user.address).call();
        dogger = parseInt(doggers[0]);
        var doggerStatus = await contracts.bay.methods.getShip(settings.landX,settings.landY,user.address).call();
        console.log("doggerStatus",doggerStatus)
        if(!doggerStatus.floating){
          await web3.eth.personal.unlockAccount(user.address, user.password);
          console.log("~~ EMBARK ")
          await contracts.bay.methods.embark(settings.landX,settings.landY,dogger).send({
              from: user.address
          });
        }else{
          console.log("(already floating, skip embark...) ")
        }
    },

    getFish: async(settings) => {
        return await contracts.bay.getPastEvents("Fish", {
            filter:{x:settings.landX,y:settings.landY},
            fromBlock: galleass.creationBlock,
            toBlock: "latest"
        });
    },

    getCatches: async(settings) => {
        return await contracts.bay.getPastEvents("Catch", {
            filter:{x:settings.landX,y:settings.landY},
            fromBlock: galleass.creationBlock,
            toBlock: "latest"
        });
    },

    getShip: async(settings) => {
        var ethShip = await contracts.bay.methods.ships(settings.landX,settings.landY,user.address).call({
            from: user.address
        });
        var shipLocation = await contracts.bay.methods.shipLocation(settings.landX,settings.landY,user.address).call({
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

    getHarborLocation: async(settings) => {
        return parseInt(await contracts.bay.methods.getHarborLocation(settings.landX,settings.landY).call());
    },

    getFishLocation: async(id) => {
        return await contracts.bay.methods.fishLocation(id).call();
    },

    setSail: async(settings,direction) => {
        try {
            await web3.eth.personal.unlockAccount(user.address, user.password);
            await contracts.bay.methods.setSail(settings.landX,settings.landY,direction).send({
                from: user.address
            });
        }catch(e){}
    },

    dropAnchor: async(settings,callback) => {
        await web3.eth.personal.unlockAccount(user.address, user.password);
        await contracts.bay.methods.dropAnchor(settings.landX,settings.landY).send({
            from: user.address
        });
        if (callback) {
            await callback();
        }
    },

    castLine: async(settings,hash) => {
        await web3.eth.personal.unlockAccount(user.address, user.password);
        try { //Web3 hates castLine.
            await contracts.bay.methods.castLine(settings.landX,settings.landY,hash).send({
                from: user.address
            });
        }catch(e){}
    },

    reelIn: async(settings,id, bait) => {
        await web3.eth.personal.unlockAccount(user.address, user.password);
        try {
            return (await contracts.bay.methods.reelIn(settings.landX,settings.landY,id, bait).send({
                from: user.address
            })).events.Attempt.returnValues.result;
        } catch(e) {
            return false;
        }
    },

    getSpecies: async(settings,fish) => {
        return (await contracts.bay.methods.fish(settings.landX,settings.landY,fish).call());
    },

    sellFish: async(settings,species) => {
        await web3.eth.personal.unlockAccount(user.address, user.password);
        let fishName = "Unknown"
        for(let c in contracts){
          if(contracts[c]._address==species){
            fishName = web3.utils.toAscii(await contracts[c].methods.image().call()).replace(/[^a-z0-9A-Z ]/gmi, "")
          }
        }
        console.log("fishName:",fishName)
        if(contracts[fishName]){
          let balance = await contracts[fishName].methods.balanceOf(user.address).call()
          console.log("Balance:",balance)
          if(balance>0){
            console.log("Selling "+fishName+"("+species+") from user "+user.address+" to the fishmonger at ",settings.landX,settings.landY,settings.fishmongerTile)
            console.log(settings.landX,settings.landY,settings.fishmongerTile,species, balance)
            try{
              let result = await contracts.fishmonger.methods.sellFish(settings.landX,settings.landY,settings.fishmongerTile,species, balance).send({
                  from: user.address
              });
                console.log("done.",result.status)
            }catch(e){
              console.log(e)
            }

            let copperBalance = await contracts.copper.methods.balanceOf(user.address).call()
            if(settings.sendCopper && copperBalance>0){
              console.log("Sending "+copperBalance+" Copper to "+settings.sendCopper)
              let result = await contracts.copper.methods.transfer(settings.sendCopper,balance).send({
                  from: user.address
              });
              console.log("done sending Copper...",result.status)
            }

          }else{
            console.log("No fish to sell.. must be a bug.. keep going...")
          }
        }else{
          console.log("No Contract...")
        }
    },

    disembark: async(settings,id) => {
        await web3.eth.personal.unlockAccount(user.address, user.password);
        await contracts.bay.methods.disembark(settings.landX,settings.landY,ship).send({
            from: user.address
        });
    }
}
