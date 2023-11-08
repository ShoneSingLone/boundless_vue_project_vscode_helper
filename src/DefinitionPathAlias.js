const { Position, Location, Uri, Disposable } = require("vscode");
const { getNormalizedAbsolutePath } = require("./utils");
const path = require("path");

exports.DefinitionPathAlias = class DefinitionPathAlias {
  constructor(configs) {
    this.ALIAS_PATH_CACHE = {};
    this._configs = configs;
    this._disposable = Disposable.from();
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

  dispose() {
    this._disposable.dispose();
  }

  async provideDefinition(document, position) {
    let tryJs;
    /* @ts-ignore */
    const { path: DOC_URI_PATH } = document.uri;
    let range = document.getWordRangeAtPosition(
      position,
      /"([^"]*)\.vue"|'([^']*)\.vue'|`([^`]*)\.vue`/,
    );

    if (!range) {
      tryJs = true;
      range = document.getWordRangeAtPosition(
        position,
        /"([^"]*)"|'([^']*)'|`([^`]*)`/,
      );

      if (!range) {
        return;
      }
    }

    let ALIAS_PATH = document
      .getText(range)
      .replace(/["|'|`]/g, "")
      .trim();

    // console.log("🚀 ALIAS_PATH:", ALIAS_PATH);

    let normalizedAbsolutePath = getNormalizedAbsolutePath({
      DOC_URI_PATH,
      ALIAS_PATH,
      ALIAS_ARRAY: this.cptAliasArray,
      ROOT_PATH: this._configs.wsRoot || "",
      ALIAS_PATH_CACHE: this.ALIAS_PATH_CACHE,
    });

    if (normalizedAbsolutePath) {
      return new Location(Uri.file(normalizedAbsolutePath), new Position(0, 0));
    }
    return null;
  }
};
