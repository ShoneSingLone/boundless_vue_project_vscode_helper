const path = require("path");
const fs = require("fs");
const {
  CompletionItem,
  CompletionItemKind,
  Disposable,
  workspace,
  window,
  MarkdownString,
} = require("vscode");
const {
  getIndexOfWorkspaceFolder,
  isObject,
  getInsertPathRange,
  getNormalizedAbsolutePath,
  asyncAllDirAndFile,
} = require("./utils");

/**
 * @type import("vscode").CompletionItemProvider
 */
class ProvierCompletion {
  _aliasList;
  _statMap;
  _disposable;
  _ignoreExtensionList;
  _needExtension;
  _autoSuggestion;
  _configs;

  constructor(configs) {
    this._configs = configs;
    workspace.onDidChangeConfiguration((e) => {
      console.log("onDidChangeConfiguration", e);
    });
    this._disposable = Disposable.from();
  }
  dispose() {
    this._disposable.dispose();
  }

  get cptAliasArray() {
    if (!this._configs?._aliasArray) {
      const { alias } = this._configs.useBoundlessVue || {};
      if (alias) {
        this._configs._aliasArray = Object.entries(alias);
      }
    }
    return this._configs._aliasArray;
  }

  async provideCompletionItems(
    document,
    /* TextDocument */ position /* CompletionContext */,
  ) {
    const completionArray = [];

    /* 未完成的就补充路径 */
    const reg_undone = /"([^"]*)\/"|'([^']*)\/'|`([^`]*)\/`/;
    let range = document.getWordRangeAtPosition(position, reg_undone);
    if (range) {
      const ALIAS_PATH = document.getText(range).replace(/["|'|`]/g, "");

      const { path: DOC_URI_PATH } = document.uri;

      let normalizedAbsolutePath = getNormalizedAbsolutePath({
        DOC_URI_PATH,
        ALIAS_PATH,
        ALIAS_ARRAY: this.cptAliasArray,
        ROOT_PATH: this._configs.wsRoot || "",
      });

      const [, files] = await asyncAllDirAndFile([normalizedAbsolutePath]);

      files
        .filter((i) => /.vue$/.test(i))
        .forEach((file) => {
          let label = file
            .replace(normalizedAbsolutePath, "")
            .replaceAll(path.sep, "/")
            .replace(/^\//, "");

          const completionItem = new CompletionItem(
            label,
            CompletionItemKind.File,
          );

          completionArray.push(completionItem);
        });
    }

    return completionArray;
  }

  /* CompletionItem[] */
  importCompletion(document /* TextDocument */, position /* Position */) {
    return [undefined];
    const importReg = /(import\s*){([^{}]*)}\s*from\s*(?:('(?:.*)'|"(?:.*)"))/g;
    const content = document.getText();
    const zeroBasedPosition = document.offsetAt(position);
    const completionList = [];
    const index = getIndexOfWorkspaceFolder(document.uri);
    if (index === undefined) return completionList;
    console.time("reg");
    let execResult = null;
    while ((execResult = importReg.exec(content))) {
      const [, beforeLeftBrace, importIdentifiers] = execResult;
      const index = execResult.index;
      const leftBrachStart = index + beforeLeftBrace.length;
      if (
        zeroBasedPosition > leftBrachStart &&
        zeroBasedPosition <= leftBrachStart + importIdentifiers.length + 1
      ) {
        break;
      }
    }
    console.timeEnd("reg");
    if (execResult) {
      let [, , importIdentifiers, pathAlias] = execResult;
      pathAlias = pathAlias.slice(1, -1);
      const mostLike = mostLikeAlias(
        this._aliasList[index],
        pathAlias.split("/")[0],
      );

      if (mostLike) {
        const pathList = [
          this._statMap[index][mostLike]["absolutePath"],
          ...pathAlias.split("/").slice(1),
        ];
        let absolutePath = path.join(...pathList);
        let extname = path.extname(absolutePath);
        if (!extname) {
          if (fs.existsSync(`${absolutePath}.js`)) {
            extname = "js";
          } else if (fs.existsSync(`${absolutePath}.ts`)) {
            extname = "ts";
          } else if (fs.existsSync(normalizePath(absolutePath))) {
            absolutePath += "/index";
            extname = "js";
          }
        }
        if (extname === "js" || extname === "ts") {
          console.time("ast");
          const absolutePathWithExtname = absolutePath + "." + extname;
          const file = fs.readFileSync(absolutePathWithExtname, {
            encoding: "utf8",
          });
          // 这里是已经导入的函数或变量
          const importIdentifierList = importIdentifiers
            .split(",")
            .filter(Boolean)
            .map((id) => id.trim());
          const exportIdentifierList = traverse(absolutePathWithExtname, file);
          console.timeEnd("ast");

          const retCompletionList = exportIdentifierList
            .filter(
              (token) => importIdentifierList.indexOf(token.identifier) === -1,
            )
            .map((token) => {
              const completionItem = new CompletionItem(token.identifier);
              completionItem.sortText = `0${token.identifier}`;
              completionItem.kind =
                token.kind === "function"
                  ? CompletionItemKind.Function
                  : CompletionItemKind.Property;
              completionItem.documentation = token.description;
              return completionItem;
            });
          completionList.push(...retCompletionList);
        }
      }
    }
    return completionList;
  }
}

exports.ProvierCompletion = ProvierCompletion;
