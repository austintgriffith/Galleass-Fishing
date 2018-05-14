var settings = require("./settings.json");
var eth = require("./eth.js");

(async () => {
    await eth.start(settings);
    
    var keepFishing = true;
    var rl = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question("", async () => {
        keepFishing = false;
    });
    
    
    async function goFishing() {
        console.log("Press enter to stop fishing.");
        
        var activeFishes = {};
        var fish = await eth.getFish();
        var catches = await eth.getCatches();
        
        for (var i in fish) {
            activeFishes[fish[i].returnValues.id] = true;
        }
        for (var i in catches) {
            delete activeFishes[catches[i].returnValues.id];
        }
        
        var shipLocation, closestIndex = 0, closestDistance, fishLocation, distance, species;
        shipLocation = (await eth.getShip()).location;
        for (var i in activeFishes) {
            fishLocation = (await eth.getFishLocation(i))["0"];
            distance = ((shipLocation > fishLocation) ? (shipLocation - fishLocation) : (fishLocation - shipLocation))
            if (closestIndex === 0) {
                closestIndex = i;
                closestDistance = distance;
                continue;
            }
            
            if (distance < closestDistance) {
                closestIndex = i;
                closestDistance = distance;
            }
        }
        var species = await eth.getSpecies(closestIndex);
        
        var direction = false;
        if (shipLocation <= (await eth.getFishLocation(closestIndex))["0"]) {
            direction = true;
        }
        await eth.setSail(direction);
        
        var anchorInterval = setInterval(async () => {
            //Kept as a callback so if we fail, we can loop back to this. It's the equivalent of a goto.
            async function anchorCB() {
                var random = eth.web3.utils.randomHex(32);
                console.log("Casting a line...");
                await eth.castLine(eth.web3.utils.sha3(random));
                console.log("Reeling it in...");
                var caughtFish = await eth.reelIn(closestIndex, random);
                if (!(caughtFish)) {
                    console.log("We didn't catch anything :( Trying again...");
                    anchorCB();
                    return;
                }
                
                console.log("We caught something!");
                await eth.sellFish(species);
                console.log("Sold the fish.");
            }
            
            var ship = await eth.getShip();
            console.log("Your ship's location: " + ship.location);
            console.log("The fish's location: " + (await eth.getFishLocation(closestIndex))["0"]);
            if ((direction) && (ship.location > ((await eth.getFishLocation(closestIndex))["0"]) - 1024)) {
                clearInterval(anchorInterval);
                await eth.dropAnchor(anchorCB);
            } else if ((!(direction)) && (ship.location - 1024 < (await eth.getFishLocation(closestIndex))["0"])) {
                clearInterval(anchorInterval);
                await eth.dropAnchor(anchorCB);
            }
        }, 10000);
    }
    
    await eth.embark();
    do {
        await goFishing();
    } while (keepFishing && (parseFloat(eth.getBalance()) > 0.15));
    
    console.log(" Returning to the harbor...");
    await eth.setSail((await eth.getShip()).location < (await eth.getHarborLocation()));
    var disembarkInterval = setInterval(async () => {
        if (Math.abs(((await eth.getShip()).location) - (await eth.getHarborLocation())) < 3000) {
            clearInterval(disembarkInterval);
            console.log("We're close enough to disembark!");
            await eth.dropAnchor();
            await eth.disembark();
            console.log("Disembarked!");
        }
    }, 5000);
})();
