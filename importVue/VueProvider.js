const { Position, Location, Uri } = require('vscode');

class VueProvier {
    constructor(configs) {
        this._aliasArray = undefined;
        this.configs = configs;
    }

    get aliasArray() {
        if (!this._aliasArray) {
            const { alias } = this.configs.useBoundlessVue || {};
            if (alias) {
                this._aliasArray = Object.entries(alias);
            }
        }
        return this._aliasArray;
    }

    get rootPath() {
        return this.configs.wsRoot || "";
    }

    async provideDefinition(document, position) {
        /* @ts-ignore */
        const { path } = document.uri;
        let isInBusiness = /\/business_(.*)\//.test(path);

        const range = document.getWordRangeAtPosition(position, /"([^"]*)\.vue"|'([^']*)\.vue'|`([^`]*)\.vue`/);

        if (!range) {
            return;
        }

        const ALIAS_PATH = document
            .getText(range)
            .replace(/["|'|`]/g, "")
            .trim();
        // console.log("🚀 ALIAS_PATH:", ALIAS_PATH);

        let SRC_ROOT_PATH, FILE_PATH, APP_NAME;




        let normalizedAbsolutePath = (() => {

            if (isInBusiness) {
                [SRC_ROOT_PATH, FILE_PATH] = path.split("business_");
                [APP_NAME] = FILE_PATH.split("/");
            }

            if (/^@\/(.*)/.test(ALIAS_PATH)) {
                /* 讲道理，_s的文件不会访问business_下的文件 */
                return String(ALIAS_PATH).replace(
                    /^@/,
                    `${SRC_ROOT_PATH}/business_${APP_NAME}`
                );
            }


            let isInAliasMap = false;
            for (const element of this.aliasArray) {
                const [reg, target] = element;
                if (new RegExp(reg).test(ALIAS_PATH)) {
                    SRC_ROOT_PATH = ALIAS_PATH.replace(new RegExp(reg), target);
                    isInAliasMap = true;
                    break;
                }
            }

            if (isInAliasMap) {
                return `${this.rootPath}${SRC_ROOT_PATH}`;
            }
        })();

        if (normalizedAbsolutePath) {
            return new Location(Uri.file(normalizedAbsolutePath), new Position(0, 0));
        }

        return null;
    }
}

exports.VueProvier = VueProvier;