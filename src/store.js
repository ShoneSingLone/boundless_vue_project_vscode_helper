const { find } = require("lodash");

const vueFiles = {
    records: [],
    get(name) {
        return vueFiles.records.filter(i => i.name === name);
    },
    delete(request) {
        try {
            let index = vueFiles.records.findIndex(
                record => record.fileInfo.path === request.file.path
            );
            if (index !== -1) {
                vueFiles.records.splice(index, 1);
            }
        } catch (error) {
            console.error(error);
        } finally {
            return true;
        }
    },
    /**
     * @description 
     * 
     * @param {any} { appName, ext, fileContentString, fileInfo, fileName, urlInSourceCode } 
     * @returns 
     */
    save({ appName, ext, fileContentString, fileInfo, fileName, urlInSourceCode }) {
        appName = appName || "";
        fileName = fileName.trim();
        if (fileName === "" || fileName.length === 1) {
            return;
        }
        let record = find(vueFiles.records, (
            record => record.appName === appName && record.urlInSourceCode === urlInSourceCode
        ));

        if (!record) {
            vueFiles.records.push({
                appName,
                ext,
                fileContentString,
                fileInfo,
                fileName,
                urlInSourceCode
            });
        }
    }
};


const utilsVar = {
    records: [

    ],
    add() {

    },
    del() {

    }
};



exports.store = {
    utilsVar,
    vueFiles,
    configs: {
        "alias": {
            "^/common/": "/static_vue2/common/"
        },
        "analysis": {
            findFilesInclude: "static_vue2/**/*.vue",
            businessPrefix: "static_vue2/business_",
            commonPrefix: "static_vue2/common/",
        },
        "globalVaribles": {
            _: 'static_vue2/common/libs/common.js',
        },
        vueVaribles: {
            _api: "static_vue2/business_anxin/utils/api.vue",
            _opts: "static_vue2/business_anxin/utils/opts.vue",
        }
    }
};