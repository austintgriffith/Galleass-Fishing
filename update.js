const fs = require('fs');
console.log("Updating settings and ABIs to latest Galleass build using local files (assuming Galleass is checked out at ../):");
let contracts = [
  "Fishmonger",
  "Galleass",
  "Harbor",
  "Bay",
  "Dogger",
  "Catfish",
  "Dangler",
  "Pinner",
  "Redbass",
  "Snark",
  "Copper",
  "Land",
  "LandLib",
]
for(let c in contracts){
  console.log(contracts[c]+"...")
  fs.copyFileSync("../galleass/"+contracts[c]+"/"+contracts[c]+".abi", "./abis/"+contracts[c].toLowerCase()+".json");
}


let galleassAddress = fs.readFileSync("../galleass/Galleass/Galleass.address").toString().trim()
let galleassBlock = fs.readFileSync("../galleass/Galleass/Galleass.blockNumber").toString().trim()

let currentSettings = JSON.parse(fs.readFileSync("settings.json").toString().trim());

currentSettings.galleass = galleassAddress
currentSettings.creationBlock = galleassBlock

fs.writeFileSync("settings.json",JSON.stringify(currentSettings,null, 2))

console.log(currentSettings)
