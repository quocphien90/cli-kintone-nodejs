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

* Usage
```
Usage: main [options]

cli-kintone

Options:
    -V, --version                        output the version number
    -d, --domain <domain>                Domain name (specify the FQDN) (default: "")
    -a, --appID <appID>                  App ID (default: 0) (default: "0")
    -u, --username <username>            User's log in name (default: "")
    -p, --password <password>            User's password (default: "")
    -t, --apiToken <apiToken>            API token (default: "")
    -g, --guestSpaceId <guestSpaceId>    Guest Space ID (default: 0) (default: "0")
    -o, --outputFormat <outputFormat>    Output format. Specify either 'json' or 'csv' (default: csv) (default: "csv")
    -e, --encoding <encoding>            Character encoding. Specify one of the following -> 'utf-8'(default), 'utf-16', 'utf-16be-with-signature', 'utf-16le-with-signature', 'sjis' or 'euc-jp' (default: utf-8) (default: "utf-8")
    -U, --basicUsername <basicUsername>  Basic authentication user name (default: "")
    -P, --basicPassword <basicPassword>  Basic authentication password (default: "")
    -q, --query <query>                  Query string (default: "")
    -c, --column <fields>                Fields to export (comma separated). Specify the field code name (default: "")
    -f, --filePath <filePath>            Input file path (default: "")
    -b, --dirPath <dirPath>              Attachment file directory (default: "")
    -D, --delete                         Delete records before insert. You can specify the deleting record condition by option "-q"
    -l, --line-number <lineNumber>       Position index of data in the input file (default: 1) (default: "")
    --import                             Import data from stdin. If "-f" is also specified, data is imported from the file instead
    --export                             Export kintone data to stdout

Help Options:
    -h, --help                           output usage information
```

# Examples
## Export all columns from an app
```
$ cli-kintone -a <appID> -d <domain> -u <Login Name> -p <Password>
```