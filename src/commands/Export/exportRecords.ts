import Connection from "../../includes/connection";
import FileExport from '../Export/exportFiles';
import {getFileSync, getValidPath, getUniqueFileName} from '../../includes/common';

const config = require('../../constant/config');
const kintone = require('@kintone/kintone-js-sdk');
const fs = require('fs');
const stringify = require('csv-stringify');
const iconv = require('iconv-lite');
const util = require('util')
const path = require('path')

type RecordExportProps = {
    connectionModule: Connection;
    encoding: string,
    query?: string,
    fields: Array<string>,
    formatFile?: string,
    dirPath?: string,
}

class RecordExport {
    protected connection: object;
    protected recordModule: any;
    protected appModule: any;
    protected fileExport: FileExport;
    private timer: Date = new Date();
    protected _props: RecordExportProps;
      
  constructor(params: RecordExportProps) {
    this._props = { 
      ...{
        encoding:'',
        fields: [],
        connectionModule: null,
        timer: new Date(),
        formatFile: 'csv',
        query: ''
    }, ...params};
    
    
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
      const csvFile = util.format('%s/%s-%s.%s', process.cwd(), config.defaultCsvFileName, Date.now(), this._props.formatFile);
      const filePromiseAll = [];
      const writeCsvPromiseAll = [];
      while(true) {
          const recordsResponse = await this.getRecords(appID, offset, this._props.fields);
          const records = recordsResponse.records
          const isEOF =  records.length < config.exportRowLimit;
          let rowID = 0;
          for (let i = 0; i < records.length; i++) {
              if(records[i].$id) {
                rowID = records[i].$id.value
              } else {
                rowID = i
              }
              if(this._props.dirPath){
                  const fileFolderBK = getFileSync(process.cwd() + '/' + this._props.dirPath);
                  await this.fileExport.downloadFileByRecord(records[i], rowID, fileFolderBK, appID);
                  //filePromiseAll.push(fileDownload);
              }
          
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
                        resolve(err);
                    }
                    fs.close(fd, () => {
                        resolve();
                    });
                });
                });
            });
            writeCsvPromiseAll.push(writeCsvPromise);
          }
          offset += config.exportRowLimit
          if(isEOF) {
            break;
          }
          
        }
        //await Promise.all(filePromiseAll);
        await Promise.all(writeCsvPromiseAll);
    } catch (err) {
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
            let rowID = 0;
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
                if(records[i].$id) {
                  rowID = records[i].$id.value
                } else {
                  rowID = i
                }
                if(this._props.dirPath){
                    const fileFolderBK = getFileSync(process.cwd() + '/' + this._props.dirPath);
                    await this.fileExport.downloadFileByRecord(records[i], rowID, fileFolderBK, appID);
                    //filePromiseAll.push(fileDownload);
                }
            }
            offset += config.exportRowLimit
            if(isEOF) {
                console.log(']}')
                break;
            }
            
        }
        await Promise.all(writeJsonPromiseAll);
        //await Promise.all(filePromiseAll);
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

  makePartialColumns(fields: any, partialFields: Array<string> = []){
    const columns: any = {};
    partialFields.forEach((fieldCode: string) => {
      if(fieldCode in fields){
        columns[fieldCode] = fields[fieldCode];
      }
    })
    return columns
  }

  createRecordCsvContent(record: any, fileFolder: string, header: Array<any>) {
    let csvRowData: any = {};
    let rowID = 0;
    if(record.$id){
      rowID = record.$id.value
    }
    csvRowData = Object.assign({}, this.parseRecordCsvContent(record, rowID, fileFolder));
    const tableDatas: Array<any> = [];
    const tableCode: any = [];
    let isExistTable = false;
    let subRowCount = 1;
    Object.keys(record).forEach(key => {
      if (record[key].type === 'SUBTABLE') {
          if(record[key].value.length > 0){
            const count = record[key].value.length;
            subRowCount = (subRowCount < count) ? count: subRowCount;
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
    const csvRowDatas: any = [];
    let csvRow = Object.assign({}, csvRowData);
    let csvRowArray: any = [];
    let csvRowTableCodes: any = [];
    let csvRowTableCodeArray: any = []
    for(let rowEachTable = 0; rowEachTable < subRowCount; rowEachTable++){
    
      for (let tableCount = 0; tableCount < tableDatas.length; tableCount++) {
          const tableData = tableDatas[tableCount];
            if(record.$id){
              rowID = record.$id.value
            } else {
              rowID = rowEachTable;
            }
            if(rowEachTable < tableData.length ){
              const csvParseContent = this.parseRecordCsvContent(tableData[rowEachTable].value, rowID, fileFolder);
              csvRowArray[rowEachTable] = Object.assign({}, csvRowArray[rowEachTable], csvParseContent);
              csvRowTableCodes[tableCode[tableCount]] = tableData[rowEachTable].id;
            }
      }
      csvRowTableCodeArray.push(csvRowTableCodes);
      csvRowTableCodes = [];
    }

    for(let rowNum = 0; rowNum < csvRowArray.length; rowNum++){
        csvRowArray[rowNum] = Object.assign({}, csvRowArray[rowNum], csvRowTableCodeArray[rowNum]);
        let csvRowNum = Object.assign({}, csvRow, csvRowArray[rowNum]);
        if (rowNum === 0) {
          csvRowNum['*'] = '*';
        }
        const jsonRow = header.map(item => {
            return csvRowNum[item];
        });
        csvRowDatas.push(jsonRow);
    }  
  
    return csvRowDatas;
  }

  parseRecordCsvContent(record: any, rowID: number, fileFolder: string) {
    const csvRowData: any = {};
    Object.keys(record).forEach(key => {
      let cellValue = record[key].value;
      const tmp = [];
      switch (record[key].type) {
        case 'STATUS':
        case 'STATUS_ASSIGNEE':
        case 'CATEGORY':
          break;
        case 'MODIFIER':
        case 'CREATOR':
          csvRowData[key] = cellValue.code;
          break;
        case 'FILE':
          for (let i = 0; i < cellValue.length; i++) {
            let filePath = '';
            if(this._props.dirPath){
              filePath = util.format("%s%s%s", cellValue[i].folderPath, path.sep, cellValue[i].name)
            } else {
              filePath = filePath + cellValue[i].name;
            }
            tmp.push(filePath);
          }
          csvRowData[key] = tmp.join('\n');
          break;
        case 'CHECK_BOX':
        case 'MULTI_SELECT':
          csvRowData[key] = cellValue.join('\n');
          break;
        case 'DROP_DOWN':
        case 'RADIO_BUTTON':
          cellValue = (cellValue != null) ? cellValue : '';
          csvRowData[key] = cellValue
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
    let headers: Array<any> = [];
    let existSubtable = false;
    const formFieldsResponse = await this.appModule.getFormFields(appID);
    let formFields: any = {}
    if(this._props.fields.length > 0){
      const partialFormFields = this.makePartialColumns(formFieldsResponse.properties, this._props.fields)
      formFields = partialFormFields;
    } else {
      headers = ['$id', '$revision'];
      formFields = formFieldsResponse.properties;
    }
    Object.keys(formFields).forEach(key => {
      switch (formFields[key].type) {
        case 'STATUS':
        case 'STATUS_ASSIGNEE':
        case 'CATEGORY':
          break;
        case 'SUBTABLE':
          existSubtable = true;
          headers.push(key);
          Object.keys(formFields[key].fields).forEach(field => {
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