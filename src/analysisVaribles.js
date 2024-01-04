var fs = require('fs');
var esprima = require('esprima-next');
var { traverse, attachComments } = require('esprima-ast-utils/lib/walk');
const { VueLoader } = require('./utils');
const { each } = require('lodash');


exports.analysisVueVaribles = async function ({ fsPath, identity, documentUriPath }) {
    console.log("analysisVueVaribles", identity);
    /* d:\\workspace\\vue\\src\\core\\instance\\init.js */
    const content = await fs.promises.readFile(fsPath, "utf-8");
    /* TODO:解析，定义和注释 */

    const { scritpSourceCode } = VueLoader(content);
    // @ts-ignore
    var ast = await esprima.parseModule(scritpSourceCode, { comment: true, jsx: true, loc: true, range: true });
    // try {
    //     attachComments(ast);
    // } catch (error) {
    //     console.error(error);
    // }
    // await fs.promises.writeFile("./ast.json", JSON.stringify(ast, null, 4));
    const targetOptions = {};
    traverse(ast, (node) => {
        // console.log(node);
        /* 表达式，并且是赋值表达式 */
        const isAssignmentExpression = node?.type === "ExpressionStatement" && node?.expression?.type === "AssignmentExpression";
        const isExpressionStatement = node?.expression?.left?.object?.name === "Vue" && node?.expression?.left?.property?.name === identity;
        if (isAssignmentExpression && isExpressionStatement) {
            node.absolutePath = documentUriPath;
            targetOptions[`Vue.${identity}`] = node;
            const right = node.expression.right;
            if (right.type === "ObjectExpression") {
                each(right.properties, (property) => {
                    const key = property.key.name;
                    const value = property.value;
                    targetOptions[`Vue.${identity}.${key}`] = value;
                });
            }
        }
    });
    return targetOptions;
    // await fs.promises.writeFile("./targetOptions.json", JSON.stringify(targetOptions, null, 4));
    /* TODO:解析，定义和注释 */
};

exports.analysisCommonVaribles = async function ({ fsPath }) {
    try {
        const doc = await fs.promises.readFile(fsPath, "utf8");
        var ast = await esprima.parseScript(doc, { comment: true, jsx: true, loc: true, range: true });
        try {
            attachComments(ast);
        } catch (error) {
            console.error(error);
        }
        const targetTipsArray = [];
        traverse(ast, function (node) {
            const isAssignmentExpression = node?.type === "ExpressionStatement" && node?.expression?.type === "AssignmentExpression";
            const isLodashProperty = node?.expression?.left?.object?.name === "_" && /^\$(.*)/?.test(node?.expression?.left?.property?.name);
            if (isAssignmentExpression && isLodashProperty) {
                targetTipsArray.push(node);
            }
        });
        return {
            tipsArray: targetTipsArray,
            sourceCode: doc
        };
    } catch (error) {
        console.error(error);

    }
};