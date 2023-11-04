"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { ImportDb } = require("./import-db");
const { ImportFixer } = require("./import-fixer");
const vscode = require("vscode");
class ImportCompletion {
    constructor(context, enabled) {
        this.context = context;
        this.enabled = enabled;
        let fixer = vscode.commands.registerCommand('shone.sing.lone.resolveImport', (args) => {
            new ImportFixer().fix(args.document, undefined, undefined, undefined, [args.imp]);
        });
        context.subscriptions.push(fixer);
    }
    provideCompletionItems(document, position, token) {
        if (!this.enabled) {
            return Promise.resolve([]);
        }
        return new Promise((resolve, reject) => {
            let wordToComplete = '';
            let range = document.getWordRangeAtPosition(position);
            if (range) {
                wordToComplete = document.getText(new vscode.Range(range.start, position)).toLowerCase();
            }
            return resolve(ImportDb.all()
                .filter(f => {
                    return f.name.toLowerCase().indexOf(wordToComplete) > -1;
                })
                .map(i => this.buildCompletionItem(i, document)));
        });
    }
    buildCompletionItem(imp, document) {
        return {
            label: imp.name,
            kind: vscode.CompletionItemKind.Snippet,
            detail: `Boundless importVue ${imp.getPath(document)}`,
            documentation: `Import asdfsfd ${imp.name} from ${imp.getPath(document)}`,
            command: { title: 'AI: Autocomplete', command: 'shone.sing.lone.resolveImport', arguments: [{ imp, document }] }
        };
    }
}
exports.ImportCompletion = ImportCompletion;
