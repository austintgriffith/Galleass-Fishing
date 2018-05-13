var settings = require("./settings.json");
var eth = require("./eth.js");

(async () => {
    await eth.start(settings, async () => {
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
            console.log(JSON.stringify(await eth.getShip()))
            console.log(shipLocation);
            console.log((await eth.getFishLocation(closestIndex))["0"]);
        } catch(e) {console.log(e)}
    });
})();
