import Connection from "../../includes/connection";
import {getFileSync, getUniqueFileName} from '../../includes/common';

const config = require('../../constant/config');
const kintone = require('@kintone/kintone-js-sdk');
const util = require('util')
const path = require('path')

type FileExportProps = {
    connectionModule: Connection | null;
    connection: any;
}

class FileExport {
  protected fileModule: any;
  protected connection: any;
  private timer: Date = new Date();
  protected _props: FileExportProps;

  constructor(params: FileExportProps) {
    this._props =  { 
      ...{
          connection: null,
          connectionModule: null,
          timer: new Date(),
      }
    }
    if (params) {
        this._props = {...this._props, ...params};
    }
    
    this.connection = this._props.connection;
    this.fileModule = new kintone.File(this.connection);
  }

  getFileByRecord(record: any): Array<string> {
    const fileKeys = this.getFileRecursive(record);
    return fileKeys;
  }

  getFileRecursive(record: any, fileDatas:Array<any> = []): Array<any> {
    let fileFields = fileDatas || [];
    Object.keys(record).forEach(key => {
      if (record[key].type === 'FILE') {
        const fileFieldValues = this.getFileByField(key, record[key].value);
        fileFields = fileFields.concat(fileFieldValues);        
      }
      if (record[key].type === 'SUBTABLE') {
        const tableData = record[key].value;
        for (let i = 0; i < tableData.length; i++) {
            const fileSubFieldValues = this.getFileRecursive(tableData[i].value, fileDatas)
            if(fileSubFieldValues.length > 0){
                fileSubFieldValues[0].rowSubFieldNumber = i;
            }
            fileFields = fileFields.concat(fileSubFieldValues);
        }
      }
    });
    return fileFields;
  }

  getFileByField(fieldCode: string, fieldValue: any){
    const value = fieldValue;
    for (let i = 0; i < value.length; i++) {
        value[i].fieldCode = fieldCode;
    }
    return value;
  }

  async downloadFileByRecord(record: any, recordID: number, fileFolderBK: string, appID: number) {
    try {
      const files: Array<any> = this.getFileByRecord(record);
      for (let i = 0; i < files.length; i++) {
        let downloaFolderPath = getFileSync(fileFolderBK);
        let rowSubFieldNumber = ''
        if(typeof files[i].rowSubFieldNumber == 'number'){
            rowSubFieldNumber = util.format('-%s',files[i].rowSubFieldNumber.toString())
        }
        downloaFolderPath = getFileSync(downloaFolderPath + '/' + files[i].fieldCode + '-' + recordID + rowSubFieldNumber);
        let fileName = getUniqueFileName(files[i].name, downloaFolderPath);
        let pathDownloadFileName = util.format("%s%s%s", downloaFolderPath, path.sep, fileName)
        files[i].name = fileName
        files[i].folderPath  = util.format("%s-%s%s", files[i].fieldCode, recordID, rowSubFieldNumber)
        
        //logger.info(config.logMsg.M009.replace('[app_id]', appID).replace('[filekey]', files[i].fileKey));
        const current = new Date();
        if ((Math.abs(current.getTime() - this.timer.getTime()) >= config.connTimeout)) {
          const conn = this._props.connectionModule.getKintoneConnection();
          this.fileModule = new kintone.File(conn);
          this.timer = new Date();
        }
        await this.fileModule.download(files[i].fileKey, pathDownloadFileName);
        // logger.info(config.logMsg.M010.replace('[app_id]', appID).replace('[filekey]', files[i].fileKey));
      }
      return Promise.resolve();
    } catch (err) {
      let msg = '';
      if (err instanceof kintone.KintoneAPIException) {
        //msg = this.getAppWithErrLog(config.logMsg.M011, appID, err.get().message);
        //logger.error(msg);
      } else {
        //msg = this._props.commonModule.getAppWithErrLog(config.logMsg.M011, appID, err);
        //logger.error(msg);
      }
      return Promise.resolve(err);
    }
  }
}

export default FileExport;