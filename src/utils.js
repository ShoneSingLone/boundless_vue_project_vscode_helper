const fsSync = require("fs");
const fs = fsSync.promises;
const path = require("path");
const { URI } = require("vscode-uri");
const { store } = require("./store");

const ALIAS_PATH_CACHE = {};

exports.CLIENT_EMIT_TYPE_DELETE = "shone.sing.lone.client.emit.type.delete";
exports.CLIENT_EMIT_TYPE_SAVE = "shone.sing.lone.client.emit.type.save";
exports.CLIENT_EMIT_TYPE_COMMON_VARIBLES = "shone.sing.lone.client.emit.type.common.varibles.refresh";


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
					`${SRC_ROOT_PATH}/business_${APP_NAME}`
				);
			}

			let isInAliasMap = false;
			for (const [aliasRegExp, aliasPath] of Object.entries(store.configs.alias)) {
				if (new RegExp(aliasRegExp).test(urlInSourceCode)) {
					SRC_ROOT_PATH = urlInSourceCode.replace(new RegExp(aliasRegExp), aliasPath);
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
			const isExist = fsSync.existsSync(_path);
			if (isExist) {
				return _path;
			}
		}

		return false;
	}


	let normalizedAbsolutePath = getNormalizedAbsolutePath(urlInSourceCode);
	if (normalizedAbsolutePath) {
		return cachePath(urlInSourceCode, normalizedAbsolutePath);
	} else if (mayTryTypescript) {
		/* 尝试寻找ts */
		normalizedAbsolutePath = getNormalizedAbsolutePath(_urlInSourceCode + ".ts");
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
 * 
 * @param {*} normalizedAbsolutePath 
 * @returns Location
 */
function newFileLocation(normalizedAbsolutePath) {
	const vc = require("vscode");
	return new vc.Location(
		vc.Uri.file(normalizedAbsolutePath),
		new vc.Position(0, 0)
	);
};
exports.newFileLocation = newFileLocation;


exports.VueLoader = function (sourceCodeString) {
	function getSource(source, pickType) {
		try {
			var regex = new RegExp(`<${pickType}[^(>|())]*>`);
			var openingTag = source.match(regex);
			var targetSource = "";
			if (!openingTag) {
				return [targetSource, {}];
			} else {
				openingTag = openingTag[0];
				targetSource = source.slice(source.indexOf(openingTag) + openingTag.length, source.lastIndexOf("</" + pickType + ">"));
			}
			/* TODO: jsx解析*/
			if (["template", "setup-render"].includes(pickType)) {
				targetSource = targetSource.replace(/`/g, "\\`");
			}
			return [targetSource];
		} catch (error) {
			console.error(error);
		}
	}

	function splitCode() {
		const [scritpSourceCode] = getSource(sourceCodeString, "script");
		const [templateSourceCode] = getSource(sourceCodeString, "template");
		const [styleSourceCode] = getSource(sourceCodeString, "style");
		const [setupRenderSourceCode, { scope }] = getSource(sourceCodeString, "setup-render");
		return {
			scritpSourceCode,
			templateSourceCode,
			styleSourceCode,
			setupRenderSourceCode
		};
	}

	return splitCode();
};
