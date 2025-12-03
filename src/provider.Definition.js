const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const { store } = require("./store");
const { normalizedAbsolutePathForFS, newFileLocation, VueLoader } = require("./utils");
const { find } = require("lodash");

// Vue文件路径引用
const REG_VUE_PATH = /"([^"]*)\.vue"|'([^']*)\.vue'|`([^`]*)\.vue`/;
// 组件标签引用
const REG_COMPONENT_TAG = /\<\/?([\w-]+).*?/;
// 全局变量引用
const REG_GLOBAL_VAR = /_\.\$(\w+)/;
// Vue变量引用
const REG_VUE_VAR = /(Vue(\.\w+)+)/;
// Vue组件内部方法/属性引用
const REG_VUE_INTERNAL_REF = /this\.(\w+)|self\.(\w+)/;
/* js路径权重最低（正则特殊性最低，匹配上的概率更大），所以最后尝试 */
const REG_JS_PATH = /"([^"]*)"|'([^']*)'|`([^`]*)`/

class ProviderDefinition {
	async provideDefinition(document, position) {
		const { path: documentUriPath } = document.uri;
		let range,
			selectedString,
			isVueSFC_path,
			isTag_path,
			isJS_path,
			isGloableVar_path,
			isVueVar_path,
			isVueInternalRef_path;
		/* _.$importVue 加载的路径 */
		let currRegExp = REG_VUE_PATH;
		range = document.getWordRangeAtPosition(position, currRegExp);
		isVueSFC_path = !!range;

		(function () {
			if (isVueSFC_path) {
				return;
			}
			/* 尝试组件标签 */
			currRegExp = REG_COMPONENT_TAG;
			range = document.getWordRangeAtPosition(position, currRegExp);
			isTag_path = !!range;
			if (isTag_path) {
				return;
			}
			/* 尝试全局变量 _.$xxxxx( */
			currRegExp = REG_GLOBAL_VAR;
			range = document.getWordRangeAtPosition(position, currRegExp);
			isGloableVar_path = !!range;
			if (isGloableVar_path) {
				return;
			}
			/* 尝试Vue组件内部引用 this.xxx/self.xxx */
			currRegExp = REG_VUE_INTERNAL_REF;
			range = document.getWordRangeAtPosition(position, currRegExp);
			isVueInternalRef_path = !!range;
			if (isVueInternalRef_path) {
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
			return handleJumpToComponentTag({ tagName: selectedString });
		} else if (currRegExp === REG_GLOBAL_VAR) {
			return handleJumpToCommonUtils({ label: selectedString, documentUriPath });
		} else if (currRegExp === REG_VUE_INTERNAL_REF) {
			return handleJumpToVueInternalRef({ document, documentUriPath, selectedString });
		} else if (currRegExp === REG_VUE_VAR) {
			return handleJumpToVueVaribles({ label: selectedString });
		}

		let normalizedAbsolutePath = normalizedAbsolutePathForFS({
			documentUriPath,
			urlInSourceCode: selectedString
		});

		if (normalizedAbsolutePath) {
			return newFileLocation(normalizedAbsolutePath);
		}
		return null;
	}
}

function handleJumpToCommonUtils({ label }) {
	try {
		const { vars, files } = store.configs.globalLodash;
		if (vars && vars[label]) {
			const [fileProps, line, column] = vars[label];
			const filePath = files[fileProps];

			return [
				new vscode.Location(
					vscode.Uri.file(path.resolve(vscode.workspace.rootPath, filePath)),
					new vscode.Position(line - 1, column)
				)
			];
		}
	} catch (error) {
		console.error("Error in handleJumpToCommonUtils:", error);
	}

	return null;
}
function handleJumpToVueVaribles({ label }) {
	try {
		const { vars, files } = store.configs.globalLodash;
		if (vars && vars[label]) {
			const [fileProps, line, column] = vars[label];
			const filePath = files[fileProps];

			return [
				new vscode.Location(
					vscode.Uri.file(path.resolve(vscode.workspace.rootPath, filePath)),
					new vscode.Position(line - 1, column)
				)
			];
		}
	} catch (error) {
		console.error("Error in handleJumpToVueVaribles:", error);
	}

	return null;
}

function handleJumpToVueInternalRef({ document, documentUriPath, selectedString }) {
	try {
		const referenceName = selectedString;
		const documentContent = document.getText();
		const parsedVue = VueLoader(documentContent);
		let position = null;
		let definitionType = null;

		// 检查methods
		if (parsedVue.script.exports.methods[referenceName]) {
			definitionType = 'methods';
			position = parsedVue.findElementPosition('methods', referenceName);
		}
		// 检查computed
		else if (parsedVue.script.exports.computed[referenceName]) {
			definitionType = 'computed';
			position = parsedVue.findElementPosition('computed', referenceName);
		}
		// 检查props
		else if (parsedVue.script.exports.props[referenceName]) {
			definitionType = 'props';
			position = parsedVue.findElementPosition('props', referenceName);
		}
		// 检查data
		else if (parsedVue.script.code.includes(`data() {`) || parsedVue.script.code.includes(`data: function() {`)) {
			const dataMatch = parsedVue.script.code.match(new RegExp(`${referenceName}\s*:`));
			if (dataMatch) {
				definitionType = 'data';
				position = parsedVue.findElementPosition('data', referenceName);
			}
		}
		// 检查components
		else if (parsedVue.script.exports.components[referenceName]) {
			definitionType = 'components';
			position = parsedVue.findElementPosition('components', referenceName);
		}

		if (position && position.line !== undefined) {
			return newFileLocation(documentUriPath, position.line, position.column || 0);
		}
	} catch (error) {
		console.error("Error handling Vue internal reference jump:", error);
	}
	return null;
}
function handleJumpToComponentTag({ tagName }) {
	if (!store.configs.components[tagName]) {
		return null;
	}
	
	const suggestions = store.configs.components[tagName].map((relativePath) => {
		try {
			const absolutePath = path.resolve(vscode.workspace.rootPath, relativePath);
			
			// 尝试解析Vue文件并找到组件定义位置
			if (fs.existsSync(absolutePath)) {
				const content = fs.readFileSync(absolutePath, "utf-8");
				const parsedVue = VueLoader(content);
				
				// 查找组件名称定义
				if (parsedVue.script.exports.name === tagName) {
					const position = parsedVue.findElementPosition('component', tagName);
					if (position && position.line !== undefined) {
						return newFileLocation(absolutePath, position.line, position.column || 0);
					}
				}
			}
			// 默认跳转到文件开头
			return newFileLocation(absolutePath);
		} catch (error) {
			console.error("Error parsing Vue file for component tag:", error);
			return newFileLocation(path.resolve(vscode.workspace.rootPath, relativePath));
		}
	});

	if (!suggestions.length) {
		return null;
	}
	return suggestions;
}

exports.register = function (context) {
	const subscription = vscode.languages.registerDefinitionProvider(
		[
			{ scheme: "file", language: "vue" },
			{ scheme: "file", language: "javascript" },
			{ language: "typescript", scheme: "file" }
		],
		// @ts-ignore
		new ProviderDefinition()
	);
	context.subscriptions.push(subscription);
};
