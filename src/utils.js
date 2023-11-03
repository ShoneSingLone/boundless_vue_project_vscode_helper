const { workspace, Range } = require("vscode");
const fs = require("fs").promises;
const path = require("path");

exports.getInsertPathRange = function getInsertPathRange(
  range,
  document,
  length,
) {
  const numberOfEndPoint = document.offsetAt(range.end);
  const end = document.positionAt(numberOfEndPoint - 1);
  const start = document.positionAt(numberOfEndPoint - length - 1);
  return new Range(start, end);
};

/**
 * 返回给定的uri属于的workspaceFolder 索引
 *
 * @export
 * @param {Uri} uri
 * @returns {(number | undefined)}
 */
exports.getIndexOfWorkspaceFolder = function getIndexOfWorkspaceFolder(uri) {
  const ws = workspace.getWorkspaceFolder(uri);
  if (ws) {
    return ws.index;
  }
  return undefined;
};

exports.isObject = function isObject(obj) {
  return Object.prototype.toString.call(obj) === "[object Object]";
};

exports.getNormalizedAbsolutePath = function getNormalizedAbsolutePath({
  DOC_URI_PATH,
  ALIAS_PATH,
  ROOT_PATH,
  ALIAS_ARRAY,
  ALIAS_PATH_CACHE,
}) {
  const ext = path.extname(ALIAS_PATH);
  if (!ext) {
    ALIAS_PATH += ".js";
  }

  if (ALIAS_PATH_CACHE[ALIAS_PATH]) {
    return ALIAS_PATH_CACHE[ALIAS_PATH];
  }
  let isInBusiness = /\/business_(.*)\//.test(DOC_URI_PATH);
  let SRC_ROOT_PATH, FILE_PATH, APP_NAME;
  let normalizedAbsolutePath = (() => {
    if (isInBusiness) {
      [SRC_ROOT_PATH, FILE_PATH] = DOC_URI_PATH.split("business_");
      [APP_NAME] = FILE_PATH.split("/");
    }

    if (/^@\/(.*)/.test(ALIAS_PATH)) {
      /* 讲道理，_s的文件不会访问business_下的文件 */
      return String(ALIAS_PATH).replace(
        /^@/,
        `${SRC_ROOT_PATH}/business_${APP_NAME}`,
      );
    }

    let isInAliasMap = false;
    for (const element of ALIAS_ARRAY) {
      const [reg, target] = element;
      if (new RegExp(reg).test(ALIAS_PATH)) {
        SRC_ROOT_PATH = ALIAS_PATH.replace(new RegExp(reg), target);
        isInAliasMap = true;
        break;
      }
    }

    if (isInAliasMap) {
      return `${ROOT_PATH}${SRC_ROOT_PATH}`;
    }
  })();
  return path.normalize(
    normalizedAbsolutePath.split("/").filter(Boolean).join("/"),
  );
};

exports.asyncAllDirAndFile = async function asyncAllDirAndFile(
  array_all,
  array_dir = [],
  array_file = [],
) {
  const path_current = array_all.pop();
  const stat = await fs.stat(path_current);
  if (stat.isDirectory()) {
    array_dir.push(path.normalize(path_current));
    const dirs = await fs.readdir(path_current);
    const path_sub_dirs = dirs.map((dirName) =>
      path.resolve(path_current, dirName),
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

exports.last = (arr) => (arr.length > 0 ? arr[arr.length - 1] : "");
