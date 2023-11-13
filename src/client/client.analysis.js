
const vscode = require("vscode");
const { some } = require("lodash");
const path = require("path");
const { ClientScanner } = require("./client.scanner");


/**
 * 
 * context import("vscode").ExtensionContext 
 * @param {*} param0 
 */
exports.runClientScanner = function ({ IntellisenseClient, configs, context }) {
    const SCANNER = new ClientScanner({ configs, clientEmit });

    /**
     * @description IntellisenseClient.sendRequest;
     * @param {any} { type, payload } 
    */
    async function clientEmit({ type, payload }) {
        try {
            return await IntellisenseClient.sendRequest(type, payload);
        } catch (error) {
            // console.error(error);
            console.log("clientEmit error");
        }
    }
    function checkAnalysisRequired(file) {
        return some(configs.vueVaribles, path => {
            return file.path.indexOf(path) > -1;
        });
    }


    function scan() {

        (function watchVueSFCFiles() {
            let watcher = vscode.workspace.createFileSystemWatcher(
                new vscode.RelativePattern(
                    vscode.Uri.file(vscode.workspace.rootPath),
                    configs.analysis.findFilesInclude
                )
            );
            watcher.onDidChange(file => {
                if (checkAnalysisRequired(file)) {
                    vscode.commands.executeCommand("shone.sing.lone.scanFile", {
                        file,
                        edit: true,
                        isNeedAnalysis: true
                    });
                }
            });

            watcher.onDidCreate(file => {
                vscode.commands.executeCommand("shone.sing.lone.scanFile", {
                    file,
                    edit: true
                });
            });
            watcher.onDidDelete(file => {
                vscode.commands.executeCommand("shone.sing.lone.scanFile", {
                    file,
                    delete: true
                });
            });
        }
        )();


        (function scanGlobalVaribles() {
            (function watchGlobalVaribles() {
                let watcheLodash = vscode.workspace.createFileSystemWatcher(
                    new vscode.RelativePattern(
                        vscode.Uri.file(vscode.workspace.rootPath),
                        configs.globalVaribles._
                    )
                );
                watcheLodash.onDidChange(file => {
                    vscode.commands.executeCommand("shone.sing.lone.scanFile", {
                        file,
                        globalVaribles: true
                    });
                });
            })();
        })();




        vscode.window.showInformationMessage(
            `"boundless-vue-helper" Building cache...`
        );
        vscode.commands.executeCommand("shone.sing.lone.scanFile");
    }

    function scanFile(request = {}) {
        if (request.edit) {
            SCANNER.editOne(request);
        } else if (request.delete) {
            SCANNER.deleteOne(request);
        } else if (request.globalVaribles) {
            SCANNER.updateGlobalVaribles(request);
        } else {
            SCANNER.scanAll();
        }
    }

    function registeCommands() {
        /* 可以通过ctrl+shift+p打开命令面板,manual 调用 scanner*/
        let commandScanner = vscode.commands.registerCommand("shone.sing.lone.scanFile", request => scanFile(request));
        context.subscriptions.push(commandScanner,);
    }


    registeCommands();
    scan();
};