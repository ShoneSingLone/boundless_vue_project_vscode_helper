const vc = require("vscode");
const { store } = require("./store");
const { normalizedAbsolutePathForFS, newFileLocation } = require("./utils");
const { find } = require("lodash");


const REG_VUE_PATH = /"([^"]*)\.vue"|'([^']*)\.vue'|`([^`]*)\.vue`/;
const REG_COMPONENT_TAG = /\<\/?([\w-]+).*?/;
const REG_GLOABLE_VAR = /_\.\$(\w+)\(/;
const REG_VUE_VAR = /(Vue(\.\w+)+)/;
/* js路径权重最低（正则特殊性最低，匹配上的概率更大），所以最后尝试 */
const REG_JS_PATH = /"([^"]*)"|'([^']*)'|`([^`]*)`/;



class ProviderDefinition {
    async provideDefinition(document, position) {
        const { path: documentUriPath } = document.uri;
        let range, selectedString, isVueSFC_path, isTag_path, isJS_path, isGloableVar_path, isVueVar_path;
        /* _.$importVue 加载的路径 */
        let currRegExp = REG_VUE_PATH;
        range = document.getWordRangeAtPosition(position, currRegExp);
        isVueSFC_path = !!range;

        (function () {
            if (isVueSFC_path) {
                return;
            }
            /* 尝试tag */
            currRegExp = REG_COMPONENT_TAG;
            range = document.getWordRangeAtPosition(position, currRegExp);
            isTag_path = !!range;
            if (isTag_path) {
                return;
            }
            /* 尝试全局变量 _.$xxxxx( */
            currRegExp = REG_GLOABLE_VAR;
            range = document.getWordRangeAtPosition(position, currRegExp);
            isGloableVar_path = !!range;
            if (isGloableVar_path) {
                return;
            }
            /* 尝试Vue变量 */
            currRegExp = REG_VUE_VAR;
            range = document.getWordRangeAtPosition(position, currRegExp);
            isVueVar_path = !!range;

            if (isVueVar_path) {
                return;
            }
            /* 尝试 js 路径 */
            currRegExp = REG_JS_PATH;
            range = document.getWordRangeAtPosition(position, currRegExp);
            isJS_path = !!range;
            if (isJS_path) {
                return;
            }
        })();

        if (range) {
            selectedString = document.getText(range).match(currRegExp)[1];
        } else {
            return null;
        }

        if (isVueSFC_path) {
            selectedString = `${selectedString}.vue`;
        } else if (isGloableVar_path) {
            selectedString = `$${selectedString}`;
        }

        if (currRegExp === REG_COMPONENT_TAG) {
            return handleJumpToComponentTag({ tagName: selectedString, documentUriPath });
        } else if (currRegExp === REG_GLOABLE_VAR) {
            return handleJumpToCommonUtils({ label: selectedString, documentUriPath });
        } else if (currRegExp === REG_VUE_VAR) {
            return handleJumpToVueVaribles({ label: selectedString });
        }

        let normalizedAbsolutePath = normalizedAbsolutePathForFS({
            documentUriPath,
            urlInSourceCode: selectedString,
        });

        if (normalizedAbsolutePath) {
            return newFileLocation(normalizedAbsolutePath);
        }
        return null;
    }
}



function handleJumpToCommonUtils({ label, documentUriPath }) {

    const record = find(store.utilsVar.records, { label });
    if (record) {
        const normalizedAbsolutePath = normalizedAbsolutePathForFS({ documentUriPath, urlInSourceCode: "/common/libs/common.js" });
        const { node: { loc: { start: { line, column } } } } = record;
        return [
            new vc.Location(
                vc.Uri.file(normalizedAbsolutePath),
                new vc.Position(line - 1, column)
            )
        ];
    }
    return null;
}
function handleJumpToVueVaribles({ label }) {
    const { absolutePath, node } = store.vueVaribles.get(label);
    if (node) {
        const { loc: { start: { line, column } } } = node;
        return [
            new vc.Location(
                vc.Uri.file(absolutePath),
                new vc.Position(line - 1, column)
            )
        ];
    }
    return null;
}
function handleJumpToComponentTag({ tagName, documentUriPath }) {
    const matchString = fileInfo => {
        return tagName === fileInfo.fileName;
    };
    const suggestions = store.vueFiles.records.filter(matchString).map(({ urlInSourceCode }) => {
        const normalizedAbsolutePath = normalizedAbsolutePathForFS({
            documentUriPath,
            urlInSourceCode,
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


exports.register = function (context) {

    const subscription = vc.languages.registerDefinitionProvider(
        [
            { scheme: "file", language: "vue" },
            { scheme: "file", language: "javascript" }
        ],
        // @ts-ignore
        new ProviderDefinition()
    );
    context.subscriptions.push(subscription);


};