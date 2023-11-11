const {
    createConnection,
    TextDocuments,
    DiagnosticSeverity,
    ProposedFeatures,
    DidChangeConfigurationNotification,
    CompletionItemKind,
    TextDocumentSyncKind,
    CompletionItem,
} = require("vscode-languageserver/node");

const { asyncAllDirAndFile, getNormalizedAbsolutePath, ALIAS_PATH_CACHE } = require("../../utils");
const path = require("path");
const { Utils, URI } = require("vscode-uri");
/* 未完成的就补充路径 */
const REG_UNDONE_PATH_REG = /"([^"]*)"|'([^']*)'|`([^`]*)`/;

const isPathCompletion = (item) => {
    return REG_UNDONE_PATH_REG.test(item);
};

exports.handleCompletion = function ({ documents, context, position, textDocument, configs }) {

    let document = documents.get(textDocument.uri);
    let doc = document.getText();
    let lines = doc.split(/\r?\n/g);
    let lineText = lines[position.line];

    if (isPathCompletion(lineText)) {
        return handlePathCompletion({ lineText, document, configs });
    }

    return [
        {
            label: "TypeScript",
            kind: CompletionItemKind.Text,
            data: 1
        },
        {
            label: "JavaScript",
            kind: CompletionItemKind.Text,
            data: 2
        }
    ];
};


async function handlePathCompletion({ lineText, document, configs }) {
    try {

        const completionArray = [];
        const ALIAS_PATH = String(lineText).match(REG_UNDONE_PATH_REG)[1];
        const { path: DOC_URI_PATH } = URI.parse(document.uri);;

        let normalizedAbsolutePath = getNormalizedAbsolutePath({
            DOC_URI_PATH,
            ALIAS_PATH,
            ALIAS_ARRAY: configs._aliasArray || [],
            ROOT_PATH: configs.wsRoot || "",
            ALIAS_PATH_CACHE,
            isGetDirContent: true
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
