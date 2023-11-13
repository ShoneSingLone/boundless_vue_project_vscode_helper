const { commonVaribles, vueFiles } = require("./server/server.db");


exports.store = {
    utilsVar: commonVaribles,
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