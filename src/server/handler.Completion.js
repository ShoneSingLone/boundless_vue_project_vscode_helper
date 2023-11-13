const { CompletionItemKind, } = require("vscode-languageserver/node");

const { asyncAllDirAndFile, getNormalizedAbsolutePath, getDocInfo: getBaseInfo } = require("../utils");
const path = require("path");
const { URI } = require("vscode-uri");
const { commonVaribles } = require("./server.db");
/* 未完成的就补充路径 */
const REG_UNDONE_PATH_REG = /"([^"]*)"|'([^']*)'|`([^`]*)`/;
const REG_IS_GLOBAL_VARIBLES_REG = /_\.(.*)/;

const isPathCompletion = (item) => {
    return REG_UNDONE_PATH_REG.test(item);
};
const isGlobalVaribles = (item) => {
    return REG_IS_GLOBAL_VARIBLES_REG.test(item);
};
const isVueVaribles = (item) => {
    return REG_UNDONE_PATH_REG.test(item);
};

/* 补全路径
 * @param {*} param0 
 * @returns 
 */
exports.handleCompletion = function ({ documents, position, textDocument, configs }) {

    let { lineContent, document } = getBaseInfo({ documents, textDocument, position });

    if (isPathCompletion(lineContent)) {
        return handlePathCompletion({ lineContent, document, configs });
    }

    if (isGlobalVaribles(lineContent)) {
        return handleGlobalVariblesCompletion({ lineContent, document, configs });
    }
    if (isVueVaribles(lineContent)) {

    }
    return null;
};


async function handlePathCompletion({ lineContent, document, configs }) {
    try {
        const completionArray = [];
        const urlInSourceCode = String(lineContent).match(REG_UNDONE_PATH_REG)[1];
        const { path: documentUriPath } = URI.parse(document.uri);;

        let normalizedAbsolutePath = getNormalizedAbsolutePath({
            ROOT_PATH: configs.wsRoot || "",
            documentUriPath,
            configsAliasArray: configs._aliasArray || [],
            urlInSourceCode,
            isGetDir: true
        });

        const [, files] = await asyncAllDirAndFile([normalizedAbsolutePath]);

        files
            .filter(i => /.vue$/.test(i))
            .forEach(file => {
                let label = file
                    .replace(normalizedAbsolutePath, "")
                    .replaceAll(path.sep, "/")
                    .replace(/^\//, "");

                const completionItem = {
                    label,
                    kind: CompletionItemKind.File
                };

                completionArray.push(completionItem);
            });
        return completionArray;
    } catch (error) {
        console.error(error);
        return null;
    }
}
function handleGlobalVariblesCompletion({ lineContent, document, configs }) {
    console.log(lineContent);
    try {
    return commonVaribles.records;
    } catch (error) {
        console.error(error);
        return null;
    }
}

