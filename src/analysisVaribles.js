var fs = require("fs");
const vscode = require("vscode");
var path = require("path");
var esprima = require("esprima-next");
const { VueLoader } = require("./utils");
const { each, indexOf } = require("lodash");
const traverse = require("@babel/traverse").default;
const parser = require("@babel/parser");

exports.analysisVueVaribles = async function ({
	fsPath,
	identity,
	documentUriPath
}) {
	console.log("analysisVueVaribles", identity);
	/* d:\\workspace\\vue\\src\\core\\instance\\init.js */
	const content = await fs.promises.readFile(fsPath, "utf-8");
	/* TODO:解析，定义和注释 */

	const { scritpSourceCode } = VueLoader(content);
	// @ts-ignore
	var ast = await esprima.parseModule(scritpSourceCode, {
		comment: true,
		jsx: true,
		loc: true,
		range: true
	});
	// try {
	//     attachComments(ast);
	// } catch (error) {
	//     console.error(error);
	// }
	// await fs.promises.writeFile("./ast.json", JSON.stringify(ast, null, 4));
	const targetOptions = {};
	traverse(ast, node => {
		// console.log(node);
		/* 表达式，并且是赋值表达式 */
		const isAssignmentExpression =
			node?.type === "ExpressionStatement" &&
			node?.expression?.type === "AssignmentExpression";
		const isExpressionStatement =
			node?.expression?.left?.object?.name === "Vue" &&
			node?.expression?.left?.property?.name === identity;
		if (isAssignmentExpression && isExpressionStatement) {
			node.absolutePath = documentUriPath;
			targetOptions[`Vue.${identity}`] = node;
			const right = node.expression.right;
			if (right.type === "ObjectExpression") {
				each(right.properties, property => {
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

function getPropertyNameName(left, prefix = "") {
	const object = left.object.name;
	if (object !== "_") {
		return;
	}
	const property = left.property.name;
	const _prefix = [object, property, prefix].filter(i => !!i).join(".");
	if (object && property) {
		if (prefix) {
			/* 如果是嵌套的，则手工添加 */
			console.log("如果是嵌套的，则手工添加", _prefix);
			return;
		}
		return _prefix;
	} else {
		if (left.object.type === "MemberExpression") {
			return getPropertyNameName(left.object, _prefix);
		}
	}
}

exports.analysisCommonVaribles = async function ({ fsPath }) {
	try {
		const sourceCode = await fs.promises.readFile(fsPath, "utf8");
		// 解析 JavaScript 代码为 AST
		const ast = parser.parse(sourceCode, {
			sourceType: "script" // 指定代码类型，可以是 'script' 或 'module'
		});
		const TIPS_ARRAY = [];
		const targetTipsDeclare = [];

		traverse(ast, {
			// FunctionDeclaration,
			AssignmentExpression(NodePath) {
				const { node } = NodePath;
				const { left, right } = node;
				if (left.type === "MemberExpression") {
					const functionName = getPropertyNameName(left);
					if (!functionName) {
						return;
					} else {
						/* 说明是_.开头的 */
						TIPS_ARRAY.push(NodePath);
					}
					if (
						["FunctionExpression", "ArrowFunctionExpression"].includes(
							right.type
						)
					) {
						console.log("🚀 函数名称:", functionName);
						const parameters = right.params.map(param => param.name);
						console.log("参数列表:", parameters);
						const innerComments = right.body.body?.[0]?.leadingComments;
						if (innerComments) {
							const [desc, type] = innerComments.map(comment => comment.value);
							if (String(desc).includes("@boundlessDesc")) {
								targetTipsDeclare.push(`
                                /** @description ${desc.replace(
																	"@boundlessDesc",
																	""
																)} */
                                ${functionName.substring(2)}: ${type.replace(
																	"@boundlessType",
																	""
																)}`);
							}
						}
					} else {
						console.log("right.type", right.type);
					}
				} else {
					console.log("left.type", left.type, left.name);
				}
			}
		});

		await fs.promises.writeFile(
			path.resolve(
				vscode.workspace.rootPath,
				"d.ts/types/lodash/common/auto.scan.lodash.d.ts"
			),
			`import _ = require("../index");
        declare module "../index" {
            interface LoDashStatic {${targetTipsDeclare.join(";\r\n")}
            }
        }
`
		);
		return {
			TIPS_ARRAY,
			sourceCode
		};
	} catch (error) {
		console.error(error);
	}
};
