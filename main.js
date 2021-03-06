var settings = require("./settings.json");
var eth = require("./eth.js");

(async () => {
    var keepFishing = true;
    var currentlyFishing = false;

    var rl = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question("", async () => {
        console.log("Finishing this run and then returning to harbor.");
        keepFishing = false;
    });


    async function goFishing() {
        console.log("Press enter to stop fishing.");

        var activeFishes = {};
        var fish = await eth.getFish(settings);
        var catches = await eth.getCatches(settings);

        for (var i in fish) {
            activeFishes[fish[i].returnValues.id] = true;
        }
        for (var i in catches) {
            delete activeFishes[catches[i].returnValues.id];
        }

        var shipLocation, closestIndex = 0, closestDistance, fishLocation, distance, species;
        shipLocation = (await eth.getShip(settings)).location;
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
        var species = await eth.getSpecies(settings,closestIndex);

        var direction = false;
        if (shipLocation <= (await eth.getFishLocation(closestIndex))["0"]) {
            direction = true;
        }
        await eth.setSail(settings,direction);

        var anchorInterval = setInterval(async () => {
            var attempts = 0;
            //Kept as a callback so if we fail, we can loop back to this. It's the equivalent of a goto.
            async function anchorCB() {
                attempts++;

                var random = eth.web3.utils.randomHex(32);
                console.log("Casting a line...");
                await eth.castLine(settings,eth.web3.utils.sha3(random));
                console.log("Reeling it in...");
                var caughtFish = await eth.reelIn(settings,closestIndex, random);
                console.log("caughtFish:",caughtFish)
                if (!(caughtFish)) {
                    if (attempts === 3) {
                        console.log("We've tried too long on this fish. Moving on...");
                        currentlyFishing = false;
                        return;
                    }
                    console.log("We didn't catch anything :( Trying again...");
                    anchorCB();
                    return;
                }

                console.log("We caught something, selling fish...");
                await eth.sellFish(settings,species);
                console.log("Sold the fish and sent copper...");
                currentlyFishing = false;
            }

            var ship = await eth.getShip(settings);
            console.log("Your ship's location: " + ship.location);
            console.log("The fish's location: " + (await eth.getFishLocation(closestIndex))["0"]);
            if (Math.abs(ship.location - (await eth.getFishLocation(closestIndex))["0"]) < 1024) {
                clearInterval(anchorInterval);
                console.log("Dropping anchor...");
                await eth.dropAnchor(settings,anchorCB);
            }
        }, settings.delayBetweenFishing);
    }


    await eth.start(settings, async () => {
        await eth.embark(settings);

        var fishingInterval;
        async function fishingIntervalFunction() {
            if (keepFishing && (await eth.getBalance() > settings.minimumEth) && (!(currentlyFishing))) {
                console.log("Going for a new fish...");
                currentlyFishing = true;
                await goFishing();
                return;
            }

            if ((!(keepFishing)) || ((await eth.getBalance()) < settings.minimumEth)) {
                clearInterval(fishingInterval);
                var shutdownInterval = setInterval(async () => {
                    if (!(currentlyFishing)) {
                        clearInterval(shutdownInterval);
                        console.log("Disembark...")
                        require("./disembark.js");
                    }
                }, 3000);
            }
        }
        fishingInterval = setInterval(fishingIntervalFunction, 10000);
        fishingIntervalFunction();
    });
})();
