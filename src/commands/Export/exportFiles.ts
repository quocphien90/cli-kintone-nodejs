import Connection from "../../includes/connection";
import common from '../../includes/common';

const config = require('../../constant/config');
const kintone = require('@kintone/kintone-js-sdk');
const util = require('util')
const path = require('path')

type FileExportProps = {
    connectionModule: Connection;
    connection: any;
}

class FileExport {
  protected fileModule: any;
  protected connection: any;
  private timer: Date = new Date();
  protected _props: FileExportProps = {
    ...this._props,
    ...{
        timer: new Date(),
    }
};
  constructor(params: FileExportProps) {
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

  getFileRecursive(record: any, fileDatas:Array<string> = []): Array<string> {
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
        let backupPath = common.getFileSync(fileFolderBK);
        backupPath = common.getFileSync(backupPath + '/' + files[i].fieldCode + '_' + recordID);
        let fileName = common.getUniqueFileName(files[i].name, backupPath);
        backupPath = util.format("%s%s%s", backupPath, path.sep, fileName)
        
        //logger.info(config.logMsg.M009.replace('[app_id]', appID).replace('[filekey]', files[i].fileKey));
        const current = new Date();
        if ((Math.abs(current.getTime() - this.timer.getTime()) >= config.connTimeout)) {
          const conn = this._props.connectionModule.getKintoneConnection();
          this.fileModule = new kintone.File(conn);
          this.timer = new Date();
        }
        await this.fileModule.download(files[i].fileKey, backupPath);
        // logger.info(config.logMsg.M010.replace('[app_id]', appID).replace('[filekey]', files[i].fileKey));
      }
      return true;
    } catch (err) {
      let msg = '';
      if (err instanceof kintone.KintoneAPIException) {
        //msg = this.common.getAppWithErrLog(config.logMsg.M011, appID, err.get().message);
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