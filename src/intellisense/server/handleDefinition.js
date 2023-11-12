const { Location } = require("vscode-languageserver/node");
const { getNormalizedAbsolutePath, ALIAS_PATH_CACHE, newFileLocation } = require("../../utils");
const { URI } = require("vscode-uri");
const { records } = require("../client/import-db");

const REG_VUE_PATH = /"([^"]*)\.vue"|'([^']*)\.vue'|`([^`]*)\.vue`/;
const REG_JS_PATH = /"([^"]*)"|'([^']*)'|`([^`]*)`/;
const REG_COMPONENT_TAG = /\<\/?([\w-]+).*?/;


exports.handleDefinition = function ({ documents, textDocument, position, configs }) {
    /* @ts-ignore */
    let document = documents.get(textDocument.uri);
    const { path: DOC_URI_PATH } = URI.parse(document.uri);
    let doc = document.getText();
    let lines = doc.split(/\r?\n/g);
    let lineText = lines[position.line];



    /* _.$importVue 路径 */
    let currRegExp = REG_VUE_PATH;
    const isVueSFC_path = currRegExp.test(lineText);

    if (!isVueSFC_path) {
        /* 尝试 js 路径 */
        currRegExp = REG_JS_PATH;
        const isJS_path = currRegExp.test(lineText);
        if (!isJS_path) {
            /* 尝试tag */
            currRegExp = REG_COMPONENT_TAG;
            const isTag_path = currRegExp.test(lineText);
            if (!isTag_path) {
                return;
            }
        }
    }

    let selectedString = String(lineText).match(currRegExp)[1];


    if (isVueSFC_path) {
        selectedString = `${selectedString}.vue`;
    }


    if (currRegExp === REG_COMPONENT_TAG) {
        const tagName = selectedString;

        const matchString = fileInfo => {
            return tagName === fileInfo.fileName;
        };


        const suggestions = records.filter(matchString).map(({ fileInfo }) => {
            const normalizedAbsolutePath = getNormalizedAbsolutePath({
                DOC_URI_PATH,
                ALIAS_PATH: fileInfo.importURL,
                ALIAS_ARRAY: configs._aliasArray || [],
                ROOT_PATH: configs.wsRoot || "",
                ALIAS_PATH_CACHE,
            });
            if (normalizedAbsolutePath) {
                return newFileLocation(normalizedAbsolutePath);
            }
        });

        if (!suggestions.length) {
            return;
        }
        return suggestions;
    }

    // console.log("🚀 ALIAS_PATH:", ALIAS_PATH);

    let normalizedAbsolutePath = getNormalizedAbsolutePath({
        DOC_URI_PATH,
        ALIAS_PATH: selectedString,
        ALIAS_ARRAY: configs._aliasArray || [],
        ROOT_PATH: configs.wsRoot || "",
        ALIAS_PATH_CACHE
    });

    if (normalizedAbsolutePath) {
        return newFileLocation(normalizedAbsolutePath);
    }
    return null;
};

