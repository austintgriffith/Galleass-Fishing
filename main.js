var settings = require("./settings.json");
var eth = require("./eth.js");
var sha256 = require("js-sha256");

(async () => {
    await eth.start(settings.eth, async () => {
        await eth.embark(async () => {
            try {
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
                var species = eth.getSpecies(closestIndex);
                
                var direction = false;
                if (shipLocation < (await eth.getFishLocation(i))["0"]) {
                    await eth.setSail(true);
                }
                await eth.setSail(direction);
                
                setInterval(async () => {
                    try {
                        async function anchorCB() {
                            try {
                                console.log("Dropped the anchor. Setting out my line...");
                                var random = eth.web3.utils.randomHex(32);
                                await eth.castLine(eth.web3.utils.hexToBytes(sha256(eth.web3.utils.hexToBytes(random))), async () => {
                                    await eth.reelIn(closestIndex, random, async (caughtFish) => {
                                        if (!(caughtFish)) {
                                            anchorCB();
                                            return;
                                        }
                                        await eth.sellFish(species);
                                        await eth.setSail(!(direction));
                                        setInterval(async () => {
                                            if (await eth.nearHarbor()) {
                                                await eth.disembark();
                                            }
                                        }, 10000);
                                    });
                                });
                            } catch(e) {console.log(e)}
                        }
                        
                        var ship = await eth.getShip();
                        console.log("Got the ship.");
                        if ((direction) && (ship.location > (await eth.getFishLocation(closestIndex))["0"])) {
                            await eth.dropAnchor(anchorCB);
                        } else if ((!(direction)) && (ship.location < (await eth.getFishLocation(closestIndex))["0"])) {
                            await eth.dropAnchor(anchorCB);
                        }
                        console.log("No anchors right now.");
                    } catch(e) {console.log(e)}
                }, 10000);
            } catch(e) {console.log(e)}
        });
    });
})();
