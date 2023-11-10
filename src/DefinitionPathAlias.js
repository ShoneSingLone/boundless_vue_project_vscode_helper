const { Position, Location, Uri, Disposable } = require("vscode");
const { getNormalizedAbsolutePath } = require("./utils");
const path = require("path");
const { ImportDb } = require("./intellisense/client/import-db");
const IMPORT_VUE = "IMPORT_VUE";
const IMPORT_JS = "IMPORT_JS";
const COMPONENT_TAG = "COMPONENT_TAG";

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
		const instance = this;
		let rangeType = IMPORT_VUE;
		/* @ts-ignore */
		const { path: DOC_URI_PATH } = document.uri;
		/* _.$importVue 路径 */
		let range = document.getWordRangeAtPosition(
			position,
			/"([^"]*)\.vue"|'([^']*)\.vue'|`([^`]*)\.vue`/
		);

		/* 尝试 js 路径 */
		if (!range) {
			rangeType = IMPORT_JS;
			range = document.getWordRangeAtPosition(
				position,
				/"([^"]*)"|'([^']*)'|`([^`]*)`/
			);

			/* 尝试tag */
			if (!range) {
				rangeType = COMPONENT_TAG;
				range = document.getWordRangeAtPosition(position, /\<\/?([\w-]+).*?/);
			}

			if (!range) {
				return;
			}
		}

		if (rangeType === COMPONENT_TAG) {
			const tagName = document.getText(range).replace(/\<|\/|\>/g, "");

			const matchString = fileInfo => {
				return tagName === fileInfo.fileName;
			};

			const suggestions = ImportDb.all()
				.filter(matchString)
				.map(({ fileInfo }) => {
					const normalizedAbsolutePath = getNormalizedAbsolutePath({
						DOC_URI_PATH,
						ALIAS_PATH: fileInfo.importURL,
						ALIAS_ARRAY: instance.cptAliasArray,
						ROOT_PATH: instance._configs.wsRoot || "",
						ALIAS_PATH_CACHE: instance.ALIAS_PATH_CACHE
					});
					if (normalizedAbsolutePath) {
						return new Location(
							Uri.file(normalizedAbsolutePath),
							new Position(0, 0)
						);
					}
				});

			if (!suggestions.length) {
				return;
			}
			return suggestions;
		}

		let ALIAS_PATH = (function () {
			return document
				.getText(range)
				.replace(/["|'|`]/g, "")
				.trim();
		})();

		// console.log("🚀 ALIAS_PATH:", ALIAS_PATH);

		let normalizedAbsolutePath = getNormalizedAbsolutePath({
			DOC_URI_PATH,
			ALIAS_PATH,
			ALIAS_ARRAY: this.cptAliasArray,
			ROOT_PATH: this._configs.wsRoot || "",
			ALIAS_PATH_CACHE: this.ALIAS_PATH_CACHE
		});

		if (normalizedAbsolutePath) {
			return new Location(Uri.file(normalizedAbsolutePath), new Position(0, 0));
		}
		return null;
	}
};
