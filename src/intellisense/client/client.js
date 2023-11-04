const { AutoImport } = require("./auto-import");

function activate({ context, configs }) {
    try {

        if (!context.workspaceState.get('boundlessAutoImportConfigs')) {
            context.workspaceState.update('boundlessAutoImportConfigs', {});
        }

        let extension = new AutoImport({ context, configs });
        let start = extension.start();
        if (!start) {
            return;
        }
        extension.attachCommands();
        extension.attachFileWatcher();
        extension.scanAllVueSFC();
    } catch (error) {
        console.error(error);
    }
}

exports.activateIntellisense = activate;
