# Material Icon Font
Found some time to [scrape](https://github.com/jamesplease/material-design-icons) (thanks @jamesplease) and build the baseline, outline, round, and sharp [material icon families](https://material.io/tools/icons/?style=baseline) all into font ligatures. You can find the ligature reference gallery [here](https://peter.ng/material-icons). There's probably some bugs but feel free to try!

![demo mov](https://user-images.githubusercontent.com/1144288/47622880-8df83080-dac7-11e8-9fb4-837b4eeba369.gif)

![material-icon-gen-doc mov](https://user-images.githubusercontent.com/1144288/47612293-03ff8780-da35-11e8-9adb-7067098225b6.gif)

# reference
[icon ligature reference gallery](https://peter.ng/material-icons)

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

# using the font with [Angular Material <mat-icon>](https://material.angular.io/components/icon/overview)
1. Install package via npm `npm i --save https://github.com/petergng/materialIconFont.git`
2. Import font css in your projects style.css `@import '~material-icon-font/dist/Material-Icons.css';`
3. Define which font family you want to use in the <mat-icon> 
    - to use it globally edit style.css 
    ```
    .material-icons {
         font-family: 'Material Icons Outline'
    }
    ```
    - to use it for one element only use style or class attribute
    ```
    <mat-icon style="font-family: 'Material Icons Sharp'">fastfood</mat-icon>
    ```