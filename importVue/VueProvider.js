const { Position, Location, Uri } = require('vscode');

class VueProvier {
    async provideDefinition(document, position) {
        /* @ts-ignore */
        const { path } = document.uri;

        let isInShare = /\/_s\//.test(path);
        let isInBusiness = /\/business_(.*)\//.test(path);

        if (!(isInShare || isInBusiness)) {
            return null;
        }

        const rangeReg = /"([^"]*)"|'([^']*)'|`([^`]*)`/;
        const range = document.getWordRangeAtPosition(position, rangeReg);

        if (!range) {
            return;
        }

        const ALIAS_PATH = document
            .getText(range)
            .replace(/["|'|`]/g, "")
            .trim();

        let SRC_ROOT_PATH, FILE_PATH, APP_NAME;

        if (isInShare) {
            [SRC_ROOT_PATH] = path.split("_s");
        }

        if (isInBusiness) {
            [SRC_ROOT_PATH, FILE_PATH] = path.split("business_");
            [APP_NAME] = FILE_PATH.split("/");
        }

        let normalizedAbsolutePath = "";

        if (/^_s\/(.*)/.test(ALIAS_PATH)) {
            normalizedAbsolutePath = `${SRC_ROOT_PATH}/${ALIAS_PATH}`;
        }

        /* 讲道理，_s的文件不会访问business_下的文件 */
        if (/^@\/(.*)/.test(ALIAS_PATH)) {
            normalizedAbsolutePath = String(ALIAS_PATH).replace(
                /^@/,
                `${SRC_ROOT_PATH}/business_${APP_NAME}`
            );
        }

        if (normalizedAbsolutePath) {
            return new Location(Uri.file(normalizedAbsolutePath), new Position(0, 0));
        }

        return null;
    }
}

exports.VueProvier = VueProvier;