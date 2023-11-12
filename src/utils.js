const fs = require("fs").promises;
const path = require("path");
const { URI } = require("vscode-uri");

const ALIAS_PATH_CACHE = {};

exports.CLIENT_EMIT_TYPE_DELETE = "shone.sing.lone.client.emit.type.delete";
exports.CLIENT_EMIT_TYPE_SAVE = "shone.sing.lone.client.emit.type.save";
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
exports.getNormalizedAbsolutePath = function getNormalizedAbsolutePath({
	documentUriPath,
	urlInSourceCode,
	ROOT_PATH,
	configsAliasArray,
	isGetDir
}) {
	const ext = path.extname(urlInSourceCode);
	if (!ext && !isGetDir) {
		/* 尝试获取文件 */
		urlInSourceCode += ".js";
	}

	if (ALIAS_PATH_CACHE[urlInSourceCode]) {
		return ALIAS_PATH_CACHE[urlInSourceCode];
	}


	let isInBusiness = /\/business_(.*)\//.test(documentUriPath);
	let SRC_ROOT_PATH, FILE_PATH, APP_NAME;
	let normalizedAbsolutePath = (() => {
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
		for (const [aliasRegExp, aliasPath] of configsAliasArray) {
			if (new RegExp(aliasRegExp).test(urlInSourceCode)) {
				SRC_ROOT_PATH = urlInSourceCode.replace(new RegExp(aliasRegExp), aliasPath);
				isInAliasMap = true;
				break;
			}
		}

		if (isInAliasMap) {
			return `${ROOT_PATH}${SRC_ROOT_PATH}`;
		}
	})();


	if (normalizedAbsolutePath) {


		return path.normalize(
			normalizedAbsolutePath.split("/").filter(Boolean).join("/")
		);
	} else {
		return null;
	}
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
	const uri = URI.file(normalizedAbsolutePath);
	return {
		uri: uri.path,
		range: {
			start: { line: 0, character: 0 },
			end: { line: 0, character: 0 }
		}
	};
};
exports.newFileLocation = newFileLocation;
