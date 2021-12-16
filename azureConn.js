var azure = require('azure-storage');
const path = require('path');

const storageAccConnectionString = process.env.CONNECTION_STRING;

const blobService = azure.createBlobService(storageAccConnectionString);
var shareName = process.env.FILE_NAME;

var fileNames = [];

    blobService.listBlobsSegmented(shareName, null, function (error, results, response) {
        if (error) {
          callback(error);
          console.log("error");
        console.log(error);
        } else {
            console.log(results.entries);
            for (var i = 0; i < results.entries.length; i++) {
                fileNames.push({name: results.entries[i].name, link: blobService.getUrl(shareName, results.entries[i].name)});
            }
        }
    });

    module.exports = {
        fileNames: fileNames
    }