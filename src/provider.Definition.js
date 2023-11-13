const { normalizedAbsolutePathForFS, newFileLocation, getDocInfo: getBaseInfo } = require("../utils");
const { store } = require("./store");


const REG_VUE_PATH = /"([^"]*)\.vue"|'([^']*)\.vue'|`([^`]*)\.vue`/;
const REG_COMPONENT_TAG = /\<\/?([\w-]+).*?/;
/* js路径权重最低（正则特殊性最低，匹配上的概率更大），所以最后尝试 */
const REG_JS_PATH = /"([^"]*)"|'([^']*)'|`([^`]*)`/;

/**
 * @description 路径跳转
 * @param {*} param0 
 * @returns 
 */
module.exports = async function ({ documents, textDocument, position }) {
    const { lineContent, documentUriPath } = getBaseInfo({ documents, textDocument, position });

    /* _.$importVue 路径 */
    let currRegExp = REG_VUE_PATH;
    const isVueSFC_path = currRegExp.test(lineContent);
    if (!isVueSFC_path) {
        /* 尝试tag */
        currRegExp = REG_COMPONENT_TAG;
        const isTag_path = currRegExp.test(lineContent);
        if (!isTag_path) {
            /* 尝试 js 路径 */
            currRegExp = REG_JS_PATH;
            const isJS_path = currRegExp.test(lineContent);
            if (!isJS_path) {
                return;
            }
        }
    }

    let selectedString = String(lineContent).match(currRegExp)[1];


    if (isVueSFC_path) {
        selectedString = `${selectedString}.vue`;
    }

    if (currRegExp === REG_COMPONENT_TAG) {
        return handleJumpToComponentTag({ tagName: selectedString, documentUriPath });
    }

    let normalizedAbsolutePath = normalizedAbsolutePathForFS({
        documentUriPath,
        urlInSourceCode: selectedString,
    });

    if (normalizedAbsolutePath) {
        return newFileLocation(normalizedAbsolutePath);
    }
    return null;
};

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
