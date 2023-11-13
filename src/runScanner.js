const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const { store } = require("./store");
const { analysisCommonVaribles } = require("./analysisCommonVaribles");
const { merge, some } = require("lodash");

class Scanner {
    get spend() {
        if (this.scanStarted) {
            // @ts-ignore
            let spend = this.scanStarted - Date.now();
            this.scanStarted = 0;
            return ` (${Math.abs(spend / 1000)}s)`;
        }
        return "";
    }

    async scanAll() {
        try {
            this.scanStarted = new Date();
            const files = await vscode.workspace.findFiles(store.configs.analysis.findFilesInclude, "**/node_modules/**", 99999);
            await this.processWorkspaceFiles(files);
        } catch (error) {
            console.error(error);
        }
        try {
            const fsPath = path.resolve(vscode.workspace.rootPath, store.configs.globalVaribles._);
            this.updateGlobalVaribles({ file: { fsPath } });
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * @description 
     * @param {any} { file } 
     * 
     * @memberOf ClientScanner
     */
    async updateGlobalVaribles({ file }) {
        try {
            const records = await analysisCommonVaribles(file);
            store.utilsVar.records = records;
        } catch (error) {
            console.error(error);
        }
    }

    editOne(request) {
        this.deleteOne(request);
        this.loadOneFile(request.file, true, request.isNeedAnalysis);
    }

    async deleteOne(request) {
        store.vueFiles.delete(request);
    }
    async processWorkspaceFiles(files) {
        let index = 0,
            file,
            length = files.length;
        while ((file = files.pop())) {
            index++;
            await this.loadOneFile(file, index === length);
        }
    }

    async loadOneFile(file, isLastOne, isNeedAnalysis = false) {
        await this.processOneFile(file, isNeedAnalysis);
        if (isLastOne) {
            vscode.window.showInformationMessage(`"boundless-vue-helper" Complete${this.spend}`);
        }
    }

    async processOneFile(fileInfo, isNeedAnalysis = false) {
        const fileName = path.basename(fileInfo.path);
        const ext = path.extname(fileInfo.path);

        const [urlInSourceCode, appName] = (() => {
            if (fileInfo.path.indexOf(store.configs.analysis.businessPrefix) > -1) {
                let url = fileInfo.path.split(store.configs.analysis.businessPrefix)[1];
                url = url.split("/");
                const appName = url[0];
                url[0] = "@";
                return [url.join("/"), appName];
            }
            if (fileInfo.path.indexOf(store.configs.analysis.commonPrefix) > -1) {
                const url = fileInfo.path.split(store.configs.analysis.commonPrefix)[1];
                return [`/common/${url}`];
            }
        })();
        return analysisVueFile({ isNeedAnalysis, fileInfo, fileName, ext, urlInSourceCode, appName });
    }
}


exports.runScanner = function ({ context }) {
    (function registeCommand() {
        /* 可以通过ctrl+shift+p打开命令面板,manual 调用 scanner*/
        let commandScanner = vscode.commands.registerCommand("shone.sing.lone.scanFile", request => scanFile(request));
        context.subscriptions.push(commandScanner,);
    })();
    const SCANNER = new Scanner();

    /**
     * @description IntellisenseClient.sendRequest;
     * @param {any} { type, payload } 
    */
    function checkAnalysisRequired(file) {
        return some(store.configs.vueVaribles, path => {
            return file.path.indexOf(path) > -1;
        });
    }


    function scan() {
        (function watchVueSFCFiles() {
            let watcher = vscode.workspace.createFileSystemWatcher(
                new vscode.RelativePattern(
                    vscode.Uri.file(vscode.workspace.rootPath),
                    store.configs.analysis.findFilesInclude
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
                        store.configs.globalVaribles._
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
    scan();
};


async function analysisVueFile({ isNeedAnalysis, fileInfo, fileName, ext, urlInSourceCode, appName }) {
    let requestParams;

    function newPayload(params = {}) {
        return merge(
            {
                appName,
                fileName: fileName.replace(ext, ""),
                ext,
                urlInSourceCode,
                fileContentString: "",
                fileInfo,
            },
            params
        );
    }

    if (isNeedAnalysis) {
        const content = await fs.promises.readFile(fileInfo.fsPath, "utf-8");
        /* TODO:解析，定义和注释 */
        /* ************************* */
        /* TODO:解析，定义和注释 */
        store.vueFiles.save(newPayload({ fileContentString: content }));
    } else {
        store.vueFiles.save(newPayload());
    }
    return requestParams;
}
