# Material Icon Font
Found some time to [scrape](https://github.com/jamesplease/material-design-icons) (thanks @jamesplease) and build the baseline, outline, round, and sharp [material icon families](https://material.io/tools/icons/?style=baseline) all into font ligatures. There's probably some bugs but feel free to try!

![demo mov](https://user-images.githubusercontent.com/1144288/47622880-8df83080-dac7-11e8-9fb4-837b4eeba369.gif)

![material-icon-gen-doc mov](https://user-images.githubusercontent.com/1144288/47612293-03ff8780-da35-11e8-9adb-7067098225b6.gif)

# setup
## install node
https://nodejs.org/en/

## install package dependencies
- `npm install` at the root

# making fonts
1. Replace svgs located in res
2. Navigate and make sure directory is in the root folder
3. open makeMaterial and uncomment out the style variable you want to generate(i know this sucks for now)
4. `node makeMaterial.js` in the terminal
4. Bin will hold all generated assets
