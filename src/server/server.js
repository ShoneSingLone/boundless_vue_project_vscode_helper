/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const {
	createConnection,
	TextDocuments,
	DiagnosticSeverity,
	ProposedFeatures,
	DidChangeConfigurationNotification,
	CompletionItemKind,
	TextDocumentSyncKind
} = require("vscode-languageserver/node");
const path = require("path");
const _ = require("lodash");
let configs;


const { TextDocument } = require("vscode-languageserver-textdocument");
const { handleCompletion } = require("./handler.Completion");
const { handleDefinition } = require("./handler.Definition");
const { CLIENT_EMIT_TYPE_SAVE, CLIENT_EMIT_TYPE_DELETE, CLIENT_EMIT_TYPE_COMMON_VARIBLES } = require("../utils");
const { vueFiles, commonVaribles } = require("./server.db");
const { analysisCommonVaribles } = require("../analysisCommonVaribles");

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
/* 作为当前vscode打开文档的一个映射 */
/*  TextDocuments<TextDocument> */
const documents = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;

/**
 
 * @type import("vscode-languageclient/node").InitializeParams
 */
// @ts-ignore
connection.onInitialize(params => {
	try {
		configs = require(path.resolve(params.rootPath, "configs.boundlessHelper.js"));
		configs.wsRoot = params.rootPath;
		if (configs.alias) {
			configs._aliasArray = Object.entries(configs.alias);
		}
	} catch (error) {
		console.error(error);
	}

	const capabilities = params.capabilities;


	/**
	 * @type import("vscode-languageclient/node").InitializeResult
	 */
	return {
		capabilities: _.merge({
			definitionProvider: true,
			hoverProvider: true,
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true,
				triggerCharacters: ['.', "/"]
			}
		}, capabilities)
	};
});

connection.onRequest(CLIENT_EMIT_TYPE_DELETE, ({ request }) => {
	vueFiles.delete(request);
	return true;
});
connection.onRequest(CLIENT_EMIT_TYPE_SAVE, (record) => {
	vueFiles.save(record);
	return true;
});
connection.onRequest(CLIENT_EMIT_TYPE_COMMON_VARIBLES, async (fileInfo) => {
	const records = await analysisCommonVaribles(fileInfo);
	commonVaribles.records = records;
	return true;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(
			DidChangeConfigurationNotification.type,
			undefined
		);
	}
	connection.workspace.onDidChangeWorkspaceFolders(_event => {
		console.log("Workspace folder change event received.");
	});
});

connection.onDidChangeConfiguration(change => {
	console.log("onDidChangeConfiguration");
});

documents.onDidClose(e => {
	console.log("onDidClose");
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	console.log("onDidChangeContent");
});

/* TextDocument */
connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	console.log("onDidChangeWatchedFiles");
});

/* HoverParams */
connection.onHover(async ({ textDocument, position }) => {
	let uri = textDocument.uri;
	let document = documents.get(uri);
	let doc = document.getText();
	let lines = doc.split(/\r?\n/g);
	let line = lines[position.line];

	return {
		contents: [JSON.stringify(position), line]
	};
});

connection.onDefinition(async ({ textDocument, position }) => {
	return handleDefinition({ documents, textDocument, position, configs });
});


// This handler provides the initial list of the completion items.
connection.onCompletion(
	/* TextDocumentPositionParams */
	({ position, textDocument }) => {
		return handleCompletion({ documents, position, textDocument, configs });
	}
);

// the completion list.
connection.onCompletionResolve(
	/* CompletionItem */
	item => item
);

documents.listen(connection);
connection.listen();


