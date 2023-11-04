"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { NodeUpload } = require("./node-upload");
const FS = require("fs");
const vscode = require("vscode");
const { ImportDb } = require("./import-db");
const { AutoImport } = require("./auto-import");
const path = require("path");

class ImportScanner {
    constructor(configs) {
        const { findFilesInclude, showNotifications, higherOrderComponents } = configs;
        this.configs = configs;
        this.findFilesInclude = findFilesInclude;
        this.showNotifications = showNotifications;
        this.higherOrderComponents = higherOrderComponents;
    }
    scan(request) {
        this.scanStarted = new Date();
        vscode.workspace.findFiles(this.findFilesInclude, '**/node_modules/**', 99999).then(
            (files) => {
                this.processWorkspaceFiles(files);
            });
        // vscode.commands.executeCommand('shone.sing.lone.scanNodeModules');
    }
    edit(request) {
        ImportDb.delete(request);
        this.loadFile(request.file, true);
        // new NodeUpload(this.configs).scanNodeModules();
    }
    delete(request) {
        ImportDb.delete(request);
    }
    processWorkspaceFiles(files) {
        let index = 0, file, length = files.length;
        while (file = files.pop()) {
            index++;
            this.loadFile(file, index === length);
        }
    }
    loadFile(file, last) {
        this.processFile('', file);
        if (last) {
            this.scanEnded = new Date();
            vscode.window.showInformationMessage(`[AutoImport] cache creation complete - (${Math.abs(this.scanStarted - this.scanEnded)}ms)`);
        }
    }
    loadFile_decorator(file, last) {
        FS.readFile(file.fsPath, 'utf8', (err, data) => {
            if (err) {
                return console.log(err);
            }
            this.processFile(data, file);

            if (last) {
                this.scanEnded = new Date();
                let str = `[AutoImport] cache creation complete - (${Math.abs(this.scanStarted - this.scanEnded)}ms)`;
                vscode.window.showInformationMessage(str);
            }
        });
    }
    processFile_decorator(data, file) {
        //added code to support any other middleware that the component can  be nested in. 
        const regExp = new RegExp(`(export\\s?(default)?\\s?(class|interface|let|var|const|function)?) ((${this.higherOrderComponents}).+[, (])?(\\w+)`, "g");
        var matches = data.match(regExp);
        if (matches != null) {
            matches.forEach(m => {
                //this allows us to reliably gets the last string (not splitting on spaces)
                const mArr = regExp.exec(m);
                if (mArr === null) {
                    //this is a weird situation that shouldn't ever happen. but does?
                    return;
                }
                const workingFile = mArr[mArr.length - 1];
                const isDefault = true;
                // const isDefault = m.indexOf('default') !== -1;
                ImportDb.saveImport(workingFile, data, file, isDefault, null);
            });
        }
    }
    processFile(fileContentString, fileInfo) {

        const fileName = path.basename(fileInfo?.path);
        const isDefault = true;
        // const isDefault = m.indexOf('default') !== -1;
        ImportDb.saveImport(fileName, fileContentString, fileInfo, isDefault, null);
    }
}
exports.ImportScanner = ImportScanner;
