var settings = require("./settings.json");
var web3 = new (require("web3"))("http://localhost:8545");

var contracts = {};
async function getContract(name, target) {
    contracts[target] = await contracts.galleass.methods.getContract(web3.utils.fromAscii(name)).call();
    contracts[target] = new web3.eth.Contract(require("./abis/" + target + ".json"), contracts[target], {
        gasPrice: "10000000000",
        gas: "250000"
    });
}

async function getShipLocation() {
    return parseInt(await contracts.bay.methods.shipLocation(settings.landX,settings.landY,settings.address).call({
        from: settings.address
    }));
}

(async() => {
    contracts.galleass = new web3.eth.Contract(require("./abis/galleass.json"), settings.galleass, {
        gasPrice: "10000000000"
    });
    await getContract("Bay", "bay");

    if ((await contracts.bay.methods.ships(settings.landX,settings.landY,settings.address).call({
        from: settings.address
    })).sailing) {
        await web3.eth.personal.unlockAccount(settings.address, settings.password);
        await contracts.bay.methods.dropAnchor(settings.landX,settings.landY).send({
            from: settings.address
        });
    }

    var harborLocation = parseInt(await contracts.bay.methods.getHarborLocation(settings.landX,settings.landY).call());

    await web3.eth.personal.unlockAccount(settings.address, settings.password);
    console.log("The ship is at " + (await getShipLocation()) + " and the harbor is at " + harborLocation);
    await contracts.bay.methods.setSail(settings.landX,settings.landY,(await getShipLocation()) < harborLocation).send({
        from: settings.address
    });

    var disembarkInterval = setInterval(async () => {
        console.log("Your ship is " + Math.abs((await getShipLocation()) - harborLocation) + " pixels from the harbor.");
        if (Math.abs((await getShipLocation()) - harborLocation) < 3000) {
            clearInterval(disembarkInterval);
            await web3.eth.personal.unlockAccount(settings.address, settings.password);
            await contracts.bay.methods.dropAnchor(settings.landX,settings.landY).send({
                from: settings.address
            });
            console.log("Dropped anchor.");

            var ship = parseInt((await contracts.bay.methods.ships(settings.landX,settings.landY,settings.address).call()).id);
            await web3.eth.personal.unlockAccount(settings.address, settings.password);
            await contracts.bay.methods.disembark(settings.landX,settings.landY,ship).send({
                from: settings.address
            });
            console.log("Disembarked!");

            process.exit(0);
        }
    }, 5000);
})();
