const path = require('path');
const fs = require('fs')
const util =  require('util');

export function getLenghtCsv(rows: Array<Array<string>>): number {
    let stringInRow = '';
    rows.forEach(row => {
      stringInRow += row.join('');
    });
    return Buffer.byteLength(stringInRow);
  
};
    
export function getFileSync(filePath: string) {
        let file = filePath;
        if (!fs.existsSync(filePath)) {
          fs.mkdirSync(filePath);
        }
    
        const isWindow = process.platform === 'win32';
        if (isWindow) {
          file = file.replace(/\\/g, '/');
        }
        return file;
};
    
export function getValidPath(filePath: string) {
    let file = filePath;
    const isWindow = process.platform === 'win32';
    if (isWindow) {
      file = file.replace(/\\/g, '/');
    }
    return file;
};
    
export function getDateString(date: Date): string {
    const current = date;
    const day = current.getDate() >= 10 ? current.getDate() : '0' + current.getDate();
    const month = (current.getMonth() + 1) >= 10 ? (current.getMonth() + 1) : '0' + (current.getMonth() + 1);
    return ('' + current.getFullYear()) + month + day;
};

export function folderToDate(folderName: string) {
    let folder = folderName;
    folder = folder.slice(0, 4) + '-' + folder.slice(4);
    folder = folder.slice(0, 7) + '-' + folder.slice(7);
    return folder;
};

export function getUniqueFileName(fileName: string, dir: string): string {
  let filenameOuput: string = fileName;
  const fileExt = path.extname(fileName);
  const fileBaseName = path.basename(fileName, fileExt);
  let parentDir = util.format("%s%s", dir, path.sep)
  if (dir == "") {
    parentDir = ""
  }
  let index = 0;
  while(true) {
    let fileFullPath = util.format("%s%s", parentDir, filenameOuput)
    if(!isExistFile(fileFullPath)) {
      break;
    }
    index++
    filenameOuput = util.format("%s (%d)%s", fileBaseName, index, fileExt)
  }
  return filenameOuput
};

export function isExistFile(fileFullPath: string): boolean {
  return fs.existsSync(fileFullPath);
};

export function getEncodingCode(encoding: string): string {
    switch (encoding) {
      case "utf-16":
        return 'utf16-be'
      case "utf-16be-with-signature":
        return 'utf16-be'
      case "utf-16le-with-signature":
        return 'utf16-le'
      case "euc-jp":
        return 'EUC-JP'
      case "sjis":
        return 'Shift_JIS'
      default:
        return "utf8"
    }
}