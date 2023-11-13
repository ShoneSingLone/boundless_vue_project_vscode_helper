var fs = require('fs');
var esprima = require('esprima-next');
var { traverse, attachComments } = require('esprima-ast-utils/lib/walk');
const { map } = require('lodash');
const { CompletionItemKind } = require('vscode-languageserver/node');

exports.analysisCommonVaribles = async function ({ fsPath }) {
    try {
        const doc = await fs.promises.readFile(fsPath, "utf8");
        var ast = await esprima.parseScript(doc, { comment: true, jsx: true, loc: true, range: true });
        try {
            attachComments(ast);
        } catch (error) {
            console.error(error);
        }
        fs.writeFileSync('./ast.json', JSON.stringify(ast, null, 2));

        const target = [];
        traverse(ast, function (node) {
            const isAssignmentExpression = node?.type === "ExpressionStatement" && node?.expression?.type === "AssignmentExpression";
            const isLodashProperty = node?.expression?.left?.object?.name === "_" && /^\$(.*)/?.test(node?.expression?.left?.property?.name);
            if (isAssignmentExpression && isLodashProperty) {
                target.push(node);
            }
        });
        return map(target, node => {
            const [kind, detail] = (function () {
                if (["CallExpression", "FunctionExpression", "ArrowFunctionExpression"].includes(node.expression.right.type)) {
                    const detail = doc.substring(node.range[0], node.range[1]);
                    return [CompletionItemKind.Method, detail];
                }

                if (['Identifier'].includes(node?.expression?.right?.type)) {
                    return [CompletionItemKind.Variable];
                }

                return [CompletionItemKind.Property];
            })();

            /**
             * @type import('vscode-languageserver/node').CompletionItem
             */
            return {
                documentation: detail || "",
                node,
                label: node.expression.left.property.name,
                kind
            };
        });
    } catch (error) {
        console.error(error);

    }
};