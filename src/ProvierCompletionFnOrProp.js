const path = require("path");
const fs = require("fs");
const {
  CompletionItem,
  CompletionItemKind,
  Disposable,
  workspace,
  window,
  MarkdownString,
  Range,
  EndOfLine,
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
    this.ALIAS_PATH_CACHE = {};
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
      const { alias } = this._configs || {};
      if (alias) {
        this._configs._aliasArray = Object.entries(alias);
      }
    }
    return this._configs._aliasArray;
  }

  async provideCompletionItems(document, position) {
    const importReg = /(import\s*){([^{}]*)}\s*from\s*(?:('(?:.*)'|"(?:.*)"))/g;
    const content = document.getText();
    const CompletionItemArray = [];
    console.time('reg');
    const aliasInfoMap = new Map();
    let execResult = null;
    const importIdentifierSet = new Set();
    while ((execResult = importReg.exec(content))) {
      let empty = true;
      let [, beforeLeftBrace, importIdentifiers, pathAlias] = execResult;
      pathAlias = pathAlias.slice(1, -1);
      const index = execResult.index;
      const braceEnd =
        index + beforeLeftBrace.length + importIdentifiers.length + 1;

      importIdentifiers.split(',').forEach(identifier => {
        const normalizedIdentifier = identifier.trim();
        if (normalizedIdentifier) {
          importIdentifierSet.add(identifier.trim());
          if (empty) {
            empty = false;
          }
        }
      });
      aliasInfoMap.set(pathAlias, {
        braceEnd,
        empty
      });
    }
    const range = document.getWordRangeAtPosition(position);

    if (range) {
      
    }

    return CompletionItemArray;
  }

}


exports.ProvierCompletion = ProvierCompletion;
