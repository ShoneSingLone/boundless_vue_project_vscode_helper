/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
let IntellisenseClient;
const path = require('path');
const { workspace } = require('vscode');

const {
    LanguageClient,
    TransportKind,
} = require('vscode-languageclient/node');

/**
 * @description ExtensionContext
 * 
 * @export
 * @param {any} context 
 */
function activate({ context, configs }) {
    // The server is implemented in node
    const serverModule = context.asAbsolutePath(path.join('src', "intellisense", "server", 'server.js'));

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    /* ServerOptions */
    const serverOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
        },
    };

    // Options to control the language client
    /* LanguageClientOptions */
    const clientOptions = {
        /* .js .vue 会触发 */
        documentSelector: [
            { scheme: 'file', language: 'javascript' },
            { scheme: 'file', language: 'vue' },
        ],
        synchronize: {
            // Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: workspace.createFileSystemWatcher('**/.clientrc'),
        },
    };

    // Create the language client and start the client.
    IntellisenseClient = new LanguageClient(
        'languageServerBoundless',
        'Language Server Boundless',
        serverOptions,
        clientOptions
    );

    // Start the client. This will also launch the server
    IntellisenseClient.start();
}

function deactivate() {
    if (!IntellisenseClient) {
        return undefined;
    }
    return IntellisenseClient.stop();
}

exports.activateIntellisense = activate;
exports.deactivateIntellisense = deactivate;
