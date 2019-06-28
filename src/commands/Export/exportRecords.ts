import Connection from "../../includes/connection";
import FileExport from '../Export/exportFiles';
import {getFileSync, getValidPath} from '../../includes/common';

const config = require('../../constant/config');
const kintone = require('@kintone/kintone-js-sdk');
const fs = require('fs');
const stringify = require('csv-stringify');
const iconv = require('iconv-lite');
const util = require('util')

type RecordExportProps = {
    connectionModule: Connection;
    encoding: string,
    query?: string,
    fields?: Array<string>,
    formatFile?: string,
    dirPath?: string,
}

class RecordExport {
    protected connection: object;
    protected recordModule: any;
    protected appModule: any;
    protected fileExport: FileExport;
    private timer: Date = new Date();
    protected _props: RecordExportProps = {
        ...this._props,
        ...{
            timer: new Date(),
            formatFile: 'csv',
            query: ''
        }
    };
  constructor(params: RecordExportProps) {
    if (params) {
        this._props = {...this._props, ...params};
    }
    
    this.connection = this._props.connectionModule.getKintoneConnection()
    this.recordModule = new kintone.Record(this.connection);
    this.appModule = new kintone.App(this.connection);
    this.fileExport = new FileExport({
        connection: this.connection,
        connectionModule: this._props.connectionModule
    });
  }

  async getRecords(appId: number, offset: number, fields?: Array<string>) {
    let query: string = (this._props.query) ? this._props.query : '';
    const regex = new RegExp(`limit\s+\d+`)
	  if (regex.test(query)) {
		  return this.recordModule.getRecords(appId, query, fields)
	  }
    let newQuery = query + util.format(" limit %s offset %s", config.exportRowLimit, offset)
    return this.recordModule.getRecords(appId, newQuery, fields)
	
 }

  async exportRecordsToCSV(pathFile: string, appID: number) {
    try {
      const header = await this.createRecordCsvHeader(appID);
      let contents = [header];
      let csvLength = 0;
      let offset = 0;
      const csvFile = util.format('%s/%s-%s.%s', pathFile, config.defaultCsvFileName, Date.now(), this._props.formatFile);
      const filePromiseAll = [];
      const writeCsvPromiseAll = [];
      while(true) {
          const recordsResponse = await this.getRecords(appID, offset, this._props.fields);
          const records = recordsResponse.records
          const isEOF =  records.length < config.exportRowLimit;
          for (let i = 0; i < records.length; i++) {
              const rows = this.createRecordCsvContent(records[i], pathFile, header);
              contents = contents.concat(rows);
              csvLength += this.getLenghtCsv(rows);
              
              await fs.writeFileSync(csvFile, '');
              const writeCsvPromise = new Promise((resolve) => {
                stringify(contents, (err: Error, output:string) => {
                const fd = fs.openSync(csvFile, 'w');
                const buf = iconv.encode(output, this._props.encoding || config.defaultCharset);
                fs.write(fd, buf, 0, buf.length, null, (error: any) => {
                    if (error) {
                    //logger.error(err);
                        resolve(err);
                    }
                    fs.close(fd, () => {
                    //const logMsg = this.common.getAppLog(config.logMsg.M022, appID).replace('[num_records]', records.length);
                    //logger.info(logMsg);
                        resolve();
                    });
                });
                });
            });
            writeCsvPromiseAll.push(writeCsvPromise);
            // if (csvLength >= config.csvLimit) {
            //   //logger.error(config.logMsg.M025);
            //   break;
            // }
            if(this._props.dirPath){
                const fileFolderBK = getFileSync(pathFile + '/' + this._props.dirPath);
                const fileDownload = this.fileExport.downloadFileByRecord(records[i], records[i].$id.value, fileFolderBK, appID);
                filePromiseAll.push(fileDownload);
            }
            
          }
          offset += config.exportRowLimit
          if(isEOF) {
            break;
          }
          
        }
        await Promise.all(writeCsvPromiseAll);
        await Promise.all(filePromiseAll);
      
      
    } catch (err) {
    //   if (err instanceof kintone.KintoneAPIException) {
    //     const msg = this.common.getAppWithErrLog(config.logMsg.M008, appID, err.get().message);
    //     logger.error(msg);
    //   } else {
    //     logger.error(err);
    //   }
      return Promise.resolve(err);
    }
  }
  async exportRecordsToJson(pathFile: string, appID: number) {
    try{
        const contents = '{"records": [';
        console.log(contents)
        let offset = 0;
        const jsonFile = util.format('%s/%s-%s.%s', pathFile, config.defaultJsonFileName, Date.now(), this._props.formatFile);
        const filePromiseAll = [];
        const writeJsonPromiseAll = [];
        while(true) {
            const recordsResponse = await this.getRecords(appID, offset, this._props.fields);
            const records = recordsResponse.records
            const isEOF =  records.length < config.exportRowLimit;
            let contentRowsString = ''
            for (let i = 0; i < records.length; i++) {
                const fd = fs.openSync(jsonFile, 'w');
                await fs.writeFileSync(jsonFile, contents + '\r\n');
                const rowsString = JSON.stringify(records[i]);
                if(isEOF && i == records.length - 1){
                  console.log(rowsString)
                  contentRowsString = rowsString;
                } else {
                  console.log(rowsString + ',')
                  contentRowsString = rowsString + ',\r\n';
                }
                const buf = iconv.encode(contentRowsString, this._props.encoding || config.defaultCharset);
                const writeJsonPromise = new Promise((resolve) => {
                    fs.appendFile(jsonFile, buf, (error: any) => {
                        if(error) {
                            resolve(error);
                        }
                        fs.close(fd, () => {
                            resolve();
                        });
                    });
                });
                writeJsonPromiseAll.push(writeJsonPromise);
                
                if(this._props.dirPath){
                    const fileFolderBK = getFileSync(pathFile + '/' + this._props.dirPath);
                    const fileDownload = this.fileExport.downloadFileByRecord(records[i], records[i].$id.value, fileFolderBK, appID);
                    filePromiseAll.push(fileDownload);
                }
                
            }
            offset += config.exportRowLimit
            if(isEOF) {
                console.log(']}')
                break;
            }
            
        }
        await Promise.all(writeJsonPromiseAll);
        await Promise.all(filePromiseAll);
        await fs.appendFileSync(jsonFile, '\r\n]}');
    } catch (err) {
        return Promise.resolve(err);
    }
}

  getLenghtCsv(rows: Array<Array<string>>) {
    let stringInRow = '';
    rows.forEach(row => {
      stringInRow += row.join('');
    });
    return Buffer.byteLength(stringInRow);
  }

  createRecordCsvContent(record: any, fileFolder: string, header: Array<any>) {
    let csvRowData: any = {};
    const validFileFolder = getFileSync(fileFolder + '/file');
    csvRowData = Object.assign({}, this.parseRecordCsvContent(record, record.$id.value, validFileFolder));
    const tableDatas: Array<any> = [];
    const tableCode: Array<string> = [];
    let isExistTable = false;
    Object.keys(record).forEach(key => {
      if (record[key].type === 'SUBTABLE') {
          if(record[key].value.length > 0){
            tableDatas.push(record[key].value);
            tableCode.push(key);
          }
        isExistTable = true;
      }
    });
    
    if (tableDatas.length === 0) {
      if (isExistTable) {
        csvRowData['*'] = '*';
      }
      const data = header.map(item => {
        return csvRowData[item];
      });
      
      return [data];
    }
    const csvRowDatas = [];
    for (let j = 0; j < tableDatas.length; j++) {
        const tableData = tableDatas[j];
        for (let i = 0; i < tableData.length; i++) {
            const csvRow = Object.assign({}, csvRowData, this.parseRecordCsvContent(tableData[i].value, record.$id.value, validFileFolder));
            if (i === 0) {
                csvRow['*'] = '*';
            }
            
            csvRow[tableCode[j]] = tableData[i].id;
            const jsonRow = header.map(item => {
                return csvRow[item];
            });
            csvRowDatas.push(jsonRow);
        }
    
    }   
   
    return csvRowDatas;
  }

  parseRecordCsvContent(record: any, rowID: number, fileFolder: string) {
    const csvRowData: any = {};
    Object.keys(record).forEach(key => {
      let cellValue = record[key].value;
      const tmp = [];
      let folder = fileFolder;
      switch (record[key].type) {
        case 'UPDATED_TIME':
        case 'MODIFIER':
        case 'CREATED_TIME':
        case 'RECORD_NUMBER':
        case 'CREATOR':
          break;
        case 'FILE':
          folder = getValidPath(folder + '/' + key + '_' + rowID + '/');
          for (let i = 0; i < cellValue.length; i++) {
            const filePath = folder + cellValue[i].name;
            tmp.push(filePath);
          }
          csvRowData[key] = tmp.join('\n');
          break;
        case 'CHECK_BOX':
        case 'MULTI_SELECT':
          csvRowData[key] = cellValue.join('\n');
          break;
        case 'USER_SELECT':
        case 'ORGANIZATION_SELECT':
        case 'GROUP_SELECT':
          cellValue = cellValue.map((item: any) => item.code);
          csvRowData[key] = cellValue.join('\n');
          break;
        case 'SUBTABLE':
          break;
        default:
          if (typeof cellValue === 'object') {
            cellValue = JSON.stringify(cellValue);
          }
          csvRowData[key] = cellValue;
          break;
      }
    });
    return csvRowData;
  }

  async createRecordCsvHeader(appID: number) {
    const headers = ['$id', '$revision'];
    let existSubtable = false;
    const formFields = await this.appModule.getFormFields(appID);
    Object.keys(formFields.properties).forEach(key => {
      switch (formFields.properties[key].type) {
        case 'UPDATED_TIME':
        case 'MODIFIER':
        case 'CREATED_TIME':
        case 'RECORD_NUMBER':
        case 'CREATOR':
        case 'STATUS':
        case 'STATUS_ASSIGNEE':
          break;
        case 'SUBTABLE':
          existSubtable = true;
          headers.push(key);
          Object.keys(formFields.properties[key].fields).forEach(field => {
            headers.push(field);
          });
          break;
        default:
          headers.push(key);
      }
    });
    if (existSubtable) {
      headers.unshift('*');
    }

    return headers;
  }
}

export default RecordExport;