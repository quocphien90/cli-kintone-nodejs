#!/usr/bin/env node

import exportCommand from './commands/Export/exportCommand';
import importCommand from './commands/Import/importCommand';
import chalk from 'chalk';

const program = require('commander');
const configure = require('./constant/config')


program
    .version(configure.version)
    .description('cli-kintone')
    .option('-d, --domain <domain>', 'Domain name (specify the FQDN)', '')
    .option('-a, --appID <appID>', 'App ID (default: 0)', '0')
    .option('-u, --username <username>', 'User\'s log in name', '')
    .option('-p, --password <password>', 'User\'s password', '')
    .option('-t, --apiToken <apiToken>', 'API token', '')
    .option('-g, --guestSpaceId <guestSpaceId>', 'Guest Space ID (default: 0)', '0')
    .option('-o, --outputFormat <outputFormat>', 'Output format. Specify either \'json\' or \'csv\' (default: csv)', 'csv')
    .option('-e, --encoding <encoding>', 'Character encoding. Specify one of the following -> \'utf-8\'(default), \'utf-16\', \'utf-16be-with-signature\', \'utf-16le-with-signature\', \'sjis\' or \'euc-jp\' (default: utf-8)', 'utf-8')
    .option('-U, --basicUsername <basicUsername>', 'Basic authentication user name', '')
    .option('-P, --basicPassword <basicPassword>', 'Basic authentication password', '')
    .option('-q, --query <query>', 'Query string', '')
    .option('-c, --column <fields>', 'Fields to export (comma separated). Specify the field code name', '')
    .option('-f, --filePath <filePath>', 'Input file path', '')
    .option('-b, --dirPath <dirPath>', 'Attachment file directory', '')
    .option('-D, --delete', 'Delete records before insert. You can specify the deleting record condition by option "-q"', '')
    .option('-l, --line-number <lineNumber>', 'Position index of data in the input file (default: 1)', '')
    .option('--import', 'Import data from stdin. If "-f" is also specified, data is imported from the file instead', 'false')
    .option('--export', 'Export kintone data to stdout', 'false');

program.action(async (options: any) => {
    let isExport = (options.export != undefined) ? options.export: false;
    let isImport = (options.import!= undefined) ? options.import: false;
    if(isExport == false && isImport == false) {
        if(options.filePath){
            isExport = false;
        } else {
            isExport = true;
        }
    }  
    
    if(isImport && isExport) {
        // Error
        console.error(chalk.red("The options --import and --export cannot be specified together!"));
    } else {
        if(isExport) {
            await exportCommand(program, options)
        } else {
            await importCommand(program, options)
        }
    }
});

if(!process.argv.slice(2).length) {
    program.help()
    process.exit()
}
program.parse(process.argv);