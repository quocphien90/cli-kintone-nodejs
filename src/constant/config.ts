module.exports = {
    defaultCharset: 'utf8',
    defaultCsvFileName: 'records',
    defaultJsonFileName: 'records',
    logMsg: {
    },
    csvLimit: (1024 * 1024 * 1024) - 2000, // 1GB
    importRowLimit: 100,
    exportRowLimit: 500,
    packageName: "cli-kintone",
    version: "0.1.0",
    connTimeout: 15 * 60 * 1000 // 30 minute
};