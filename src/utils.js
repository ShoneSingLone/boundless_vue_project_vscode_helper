const fsSync = require("fs");
const fs = fsSync.promises;
const path = require("path");
const { URI } = require("vscode-uri");
const { store } = require("./store");

const ALIAS_PATH_CACHE = {};

exports.CLIENT_EMIT_TYPE_DELETE = "shone.sing.lone.client.emit.type.delete";
exports.CLIENT_EMIT_TYPE_SAVE = "shone.sing.lone.client.emit.type.save";
exports.CLIENT_EMIT_TYPE_COMMON_VARIBLES =
	"shone.sing.lone.client.emit.type.common.varibles.refresh";

function cachePath(url, _path) {
	ALIAS_PATH_CACHE[url] = path.normalize(
		_path.split("/").filter(Boolean).join("/")
	);
	return ALIAS_PATH_CACHE[url];
}

exports.getDocInfo = function ({ documents, textDocument, position }) {
	let document = documents.get(textDocument.uri);
	const { path: documentUriPath } = URI.parse(document.uri);
	let doc = document.getText();
	let lines = doc.split(/\r?\n/g);
	return {
		document,
		documentUriPath,
		lineContent: lines[position.line] || ""
	};
};

exports.getInsertPathRange = function getInsertPathRange(
	range,
	document,
	length
) {
	const numberOfEndPoint = document.offsetAt(range.end);
	const endPosition = document.positionAt(numberOfEndPoint - 1);
	const startPosition = document.positionAt(numberOfEndPoint - length - 1);

	return {
		start: startPosition,
		end: endPosition
	};
};

exports.isObject = function isObject(obj) {
	return Object.prototype.toString.call(obj) === "[object Object]";
};
/**
 * 获取可执行路径，尝试添加js后缀
 * @param {*} param0
 * @returns
 */
exports.normalizedAbsolutePathForFS = function normalizedAbsolutePathForFS({ documentUriPath, urlInSourceCode, isGetDir }) {
	const _urlInSourceCode = String(urlInSourceCode);
	const ext = path.extname(urlInSourceCode);
	let mayTryTypescript = false;
	if (!ext && !isGetDir) {
		/* 尝试获取文件 */
		urlInSourceCode = _urlInSourceCode + ".js";
		/* 如果js找不到，尝试找.ts */
		mayTryTypescript = true;
	}

	if (ALIAS_PATH_CACHE[urlInSourceCode]) {
		return ALIAS_PATH_CACHE[urlInSourceCode];
	}

	let isInBusiness = /\/business_(.*)\//.test(documentUriPath);
	let SRC_ROOT_PATH, FILE_PATH, APP_NAME;

	function getNormalizedAbsolutePath(urlInSourceCode) {
		const _path = (function () {
			if (isInBusiness) {
				[SRC_ROOT_PATH, FILE_PATH] = documentUriPath.split("business_");
				[APP_NAME] = FILE_PATH.split("/");
			}

			if (/^@\/(.*)/.test(urlInSourceCode)) {
				/* 讲道理，_s的文件不会访问business_下的文件 */
				return String(urlInSourceCode).replace(
					/^@/,
					`${SRC_ROOT_PATH}business_${APP_NAME}`
				);
			}

			let isInAliasMap = false;
			for (const [aliasRegExp, aliasPath] of Object.entries(store.configs.alias)) {
				if (new RegExp(aliasRegExp).test(urlInSourceCode)) {
					SRC_ROOT_PATH = urlInSourceCode.replace(
						new RegExp(aliasRegExp),
						aliasPath
					);
					isInAliasMap = true;
					break;
				}
			}

			if (isInAliasMap) {
				const vc = require("vscode");
				return `${vc.workspace.rootPath}${SRC_ROOT_PATH}`;
			}
		})();

		if (_path) {
			return _path;
		}

		return false;
	}

	let normalizedAbsolutePath = getNormalizedAbsolutePath(urlInSourceCode);
	if (normalizedAbsolutePath) {
		return cachePath(urlInSourceCode, normalizedAbsolutePath);
	} else if (mayTryTypescript) {
		/* 尝试寻找ts */
		normalizedAbsolutePath = getNormalizedAbsolutePath(
			_urlInSourceCode + ".ts"
		);
		if (normalizedAbsolutePath) {
			return cachePath(urlInSourceCode, normalizedAbsolutePath);
		}
	}
	return null;
};

exports.asyncAllDirAndFile = async function asyncAllDirAndFile(
	array_all,
	array_dir = [],
	array_file = []
) {
	const path_current = array_all.pop();
	const stat = await fs.stat(path_current);
	if (stat.isDirectory()) {
		array_dir.push(path.normalize(path_current));
		const dirs = await fs.readdir(path_current);
		const path_sub_dirs = dirs.map(dirName =>
			path.resolve(path_current, dirName)
		);
		array_all = array_all.concat(path_sub_dirs);
	} else {
		array_file.push(path.normalize(path_current));
	}
	if (array_all.length > 0) {
		return asyncAllDirAndFile(array_all, array_dir, array_file);
	}
	return [array_dir, array_file];
};

exports.last = arr => (arr.length > 0 ? arr[arr.length - 1] : "");

/**
 * 创建文件位置
 * @param {string} normalizedAbsolutePath 文件绝对路径
 * @param {number} line 行号（从0开始）
 * @param {number} column 列号（从0开始）
 * @returns {vscode.Location} 文件位置对象
 */
function newFileLocation(normalizedAbsolutePath, line = 0, column = 0) {
	const vc = require("vscode");
	return new vc.Location(
		vc.Uri.file(normalizedAbsolutePath),
		new vc.Position(line, column)
	);
}
exports.newFileLocation = newFileLocation;

/**
 * Vue文件解析器
 * @param {string} sourceCodeString Vue文件源代码
 * @returns {Object} 解析后的Vue文件结构
 */
exports.VueLoader = function (sourceCodeString) {
	/**
	 * 获取指定标签的内容
	 * @param {string} source 源代码
	 * @param {string} pickType 标签类型
	 * @returns {Array} [标签内容, 标签属性, 开始位置, 结束位置]
	 */
	function getSource(source, pickType) {
		try {
			var regex = new RegExp(`<${pickType}[^(>|())]*>`);
			var openingTag = source.match(regex);
			var targetSource = "";
			var startPos = 0;
			var endPos = 0;
			var attrs = {};
			
			if (!openingTag) {
				return [targetSource, attrs, startPos, endPos];
			} else {
				openingTag = openingTag[0];
				startPos = source.indexOf(openingTag) + openingTag.length;
				endPos = source.lastIndexOf("</" + pickType + ">");
				targetSource = source.slice(startPos, endPos);
				
				// 解析标签属性
				var attrRegex = /(\w+)=["']([^"']+)["']/g;
				var match;
				while ((match = attrRegex.exec(openingTag)) !== null) {
					attrs[match[1]] = match[2];
				}
			}
			
			/* TODO: jsx解析*/
			if (["template", "setup-render"].includes(pickType)) {
				targetSource = targetSource.replace(/`/g, "\\`");
			}
			return [targetSource, attrs, startPos, endPos];
		} catch (error) {
			console.error(error);
			return ["", {}, 0, 0];
		}
	}

	/**
	 * 解析script标签中的导出组件
	 * @param {string} scriptCode script标签内容
	 * @param {number} scriptStartPos script标签开始位置
	 * @returns {Object} 导出的组件信息
	 */
	function parseScript(scriptCode, scriptStartPos) {
		const exports = {
			name: null,
			components: {},
			methods: {},
			data: null,
			computed: {},
			watch: {},
			props: {},
			directives: {}
		};

		// 提取组件名称
		const nameMatch = scriptCode.match(/name\s*:\s*['"`]([^'"]+)['"`]/);
		if (nameMatch) {
			exports.name = nameMatch[1];
			exports.namePos = scriptStartPos + nameMatch.index + nameMatch[0].indexOf(nameMatch[1]);
		}

		// 提取components
		const componentsMatch = scriptCode.match(/components\s*:\s*\{([^}]+)\}/);
		if (componentsMatch) {
			const componentsCode = componentsMatch[1];
			const componentRegex = /([\w-]+)\s*:\s*([\w$_.]+)/g;
			let match;
			while ((match = componentRegex.exec(componentsCode)) !== null) {
				exports.components[match[1]] = {
					name: match[2],
					pos: scriptStartPos + componentsMatch.index + componentsMatch[0].indexOf(match[1])
				};
			}
		}

		// 提取methods
		const methodsMatch = scriptCode.match(/methods\s*:\s*\{([^}]+)\}/);
		if (methodsMatch) {
			const methodsCode = methodsMatch[1];
			const methodRegex = /([\w$]+)\s*:\s*function|([\w$]+)\s*\(/g;
			let match;
			while ((match = methodRegex.exec(methodsCode)) !== null) {
				const methodName = match[1] || match[2];
				if (methodName) {
					exports.methods[methodName] = {
						pos: scriptStartPos + methodsMatch.index + methodsMatch[0].indexOf(methodName)
					};
				}
			}
		}

		// 提取props
		const propsMatch = scriptCode.match(/props\s*:\s*\{([^}]+)\}/);
		if (propsMatch) {
			const propsCode = propsMatch[1];
			const propRegex = /([\w$]+)\s*:/g;
			let match;
			while ((match = propRegex.exec(propsCode)) !== null) {
				exports.props[match[1]] = {
					pos: scriptStartPos + propsMatch.index + propsMatch[0].indexOf(match[1])
				};
			}
		}

		// 提取computed
		const computedMatch = scriptCode.match(/computed\s*:\s*\{([^}]+)\}/);
		if (computedMatch) {
			const computedCode = computedMatch[1];
			const computedRegex = /([\w$]+)\s*:\s*function|([\w$]+)\s*\(/g;
			let match;
			while ((match = computedRegex.exec(computedCode)) !== null) {
				const computedName = match[1] || match[2];
				if (computedName) {
					exports.computed[computedName] = {
						pos: scriptStartPos + computedMatch.index + computedMatch[0].indexOf(computedName)
					};
				}
			}
		}

		return exports;
	}

	/**
	 * 解析template标签中的组件引用
	 * @param {string} templateCode template标签内容
	 * @param {number} templateStartPos template标签开始位置
	 * @returns {Object} 组件引用信息
	 */
	function parseTemplate(templateCode, templateStartPos) {
		const components = {};
		// 匹配所有自定义组件标签
		const componentRegex = /<([A-Z][\w-]+)[^>]*>/g;
		let match;
		while ((match = componentRegex.exec(templateCode)) !== null) {
			const componentName = match[1];
			if (!components[componentName]) {
				components[componentName] = [];
			}
			components[componentName].push({
				pos: templateStartPos + match.index + 1 // +1 to skip '<'
			});
		}
		return components;
	}

	/**
	 * 根据位置计算行号和列号
	 * @param {string} source 源代码
	 * @param {number} pos 位置
	 * @returns {Object} {line, column}
	 */
	function getLineAndColumn(source, pos) {
		const lines = source.slice(0, pos).split(/\r?\n/);
		return {
			line: lines.length - 1,
			column: lines[lines.length - 1].length
		};
	}

	function splitCode() {
		const [scriptCode, scriptAttrs, scriptStartPos, scriptEndPos] = getSource(sourceCodeString, "script");
		const [templateCode, templateAttrs, templateStartPos, templateEndPos] = getSource(sourceCodeString, "template");
		const [styleCode, styleAttrs, styleStartPos, styleEndPos] = getSource(sourceCodeString, "style");
		const [setupRenderCode, setupRenderAttrs, setupRenderStartPos, setupRenderEndPos] = getSource(
			sourceCodeString,
			"setup-render"
		);

		const scriptExports = parseScript(scriptCode, scriptStartPos);
		const templateComponents = parseTemplate(templateCode, templateStartPos);

		return {
			script: {
				code: scriptCode,
				attrs: scriptAttrs,
				exports: scriptExports,
				startPos,
				endPos
			},
			template: {
				code: templateCode,
				attrs: templateAttrs,
				components: templateComponents,
				startPos: templateStartPos,
				endPos: templateEndPos
			},
			style: {
				code: styleCode,
				attrs: styleAttrs,
				startPos: styleStartPos,
				endPos: styleEndPos
			},
			setupRender: {
				code: setupRenderCode,
				attrs: setupRenderAttrs,
				startPos: setupRenderStartPos,
				endPos: setupRenderEndPos
			},
			/**
			 * 查找元素在文件中的位置
			 * @param {string} type 元素类型 (component, method, prop, computed)
			 * @param {string} name 元素名称
			 * @returns {Object|null} {line, column} 或 null
			 */
			findElementPosition: function(type, name) {
				if (type === 'component') {
					// 先在script的components中查找
					if (scriptExports.components[name]) {
						return getLineAndColumn(sourceCodeString, scriptExports.components[name].pos);
					}
					// 再在script的exports.name中查找
					if (scriptExports.name === name) {
						return getLineAndColumn(sourceCodeString, scriptExports.namePos);
					}
				} else if (scriptExports[type] && scriptExports[type][name]) {
					// 查找methods, props, computed等
					return getLineAndColumn(sourceCodeString, scriptExports[type][name].pos);
				}
				return null;
			}
		};
	}

	return splitCode();
};
