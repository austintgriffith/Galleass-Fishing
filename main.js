var settings = require("./settings.json");
var eth = require("./eth.js");

(async () => {
    await eth.start(settings, async () => {
        await eth.embark(async () => {
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
                async function anchorCB() {
                    var random = eth.web3.utils.randomHex(32);
                    console.log("Casting a line...");
                    await eth.castLine(eth.web3.utils.sha3(random), async () => {
                        console.log("Reeling it in...");
                        await eth.reelIn(closestIndex, random, async (caughtFish) => {
                            if (!(caughtFish)) {
                                console.log("We didn't catch anything :( Trying again...");
                                anchorCB();
                                return;
                            }
                            
                            console.log("We caught something!");
                            await eth.sellFish(species);
                            console.log("Sold the fish. Returning to the harbor...");
                            await eth.setSail(!(direction));
                            var disembarkInterval = setInterval(async () => {
                                console.log((await eth.getShip()).location, await eth.getHarborLocation());
                                if (Math.abs(((await eth.getShip()).location) - (await eth.getHarborLocation())) < 3000) {
                                    clearInterval(disembarkInterval);
                                    await eth.disembark();
                                }
                            }, 5000);
                        });
                    });
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
        });
    });
})();
