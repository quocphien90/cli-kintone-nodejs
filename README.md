# cli-kintone-nodejs
cli-kintone is a command line utility for exporting and importing kintone App data.

# Version
0.1.0

# How to Build

## Requirement

### Getting the source code

```
$ git clone https://github.dev.cybozu.co.jp/SC/cli-kintone-nodejs.git
```

### Install dependencies
* Install all depdencies in package.json
```
$ cd cli-kintone-nodejs
$ npm install
```

### Build project
* Build all source code from typescript with target declared in tsconfig.json
```
$ tsc
```

### Compile source to binary file
* Using pkg compile nodejs into executable binary file cross-platform
```
$ npm run package:all
```

* The result binaries is included in *build* folder
```
$ cd build
$ ls
```

* These binaries are supported 
    * Windows
    * Linux
    * Mac OS X