import { CommanderStatic } from "commander";
import chalk from 'chalk'
import validator from '../../includes/validator'
import Connection from "../../includes/connection";
import RecordExport from '../Export/exportRecords'
import common from '../../includes/common';

const path = require('path');
const rimraf = require('rimraf');
const fs = require('fs')

const exportCommand = async (program: CommanderStatic, options: any) => {
    let error = validator.exportValidator(options)
    if (error && typeof error === 'string') {
        console.log(chalk.red(error))
        program.help()
        process.exit();
    }
    try {
        let connectionModule = null;
        if(options.apiToken) {
            connectionModule = new Connection({
                domain:       options.domain,
                apiToken:     options.apiToken,
                appID:        options.appID,
                guestSpaceID: options.guestSpaceID,
                proxyHost: 'dc-ty3-squid-1.cb.local',
                proxyPort: 3128
            });
        } else {
            connectionModule = new Connection({
                domain:       options.domain,
                username:     options.username,
                password:     options.password,
                appID:        options.appID,
                guestSpaceID: options.guestSpaceID,
                proxyHost: 'dc-ty3-squid-1.cb.local',
                proxyPort: 3128
            });
            
        }

        const currentWorkingDir = process.cwd();        ;
        const encoding = common.getEncodingCode(options.encoding);
        const formatFile = options.outputFormat ? options.outputFormat : 'csv';
        const recordExport = new RecordExport({
            connectionModule: connectionModule, 
            encoding: encoding,
            query: options.query,
            fields: [],
            formatFile: formatFile,
            dirPath: options.dirPath,
        });
        
        if (formatFile == 'json') {
            await recordExport.exportRecordsToJson(currentWorkingDir, options.appID);
		} else {
            await recordExport.exportRecordsToCSV(currentWorkingDir, options.appID);
		}

    } catch (error) {
        console.log(error)
        program.help()
        process.exit();
    }
}

export default exportCommand
