const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { store } = require("./store");

/**
 * 扫描common.ts文件并提取函数定义信息
 * @param {string} commonTsPath common.ts文件的绝对路径
 */
exports.scanCommonTsFile = function (commonTsPath) {
    try {
        if (!fs.existsSync(commonTsPath)) {
            console.error(`common.ts file not found: ${commonTsPath}`);
            return;
        }

        // 读取文件内容
        const content = fs.readFileSync(commonTsPath, "utf-8");

        // 提取所有$xxx函数定义
        const funcRegex = /\$([a-zA-Z_]\w*)\s*=\s*function|\$([a-zA-Z_]\w*)\s*\(|export\s+function\s+\$([a-zA-Z_]\w*)/g;
        let match;
        const functions = {};

        // 遍历所有匹配项
        while ((match = funcRegex.exec(content)) !== null) {
            // 获取函数名（匹配组中不为空的那个）
            const funcName = match[1] || match[2] || match[3];
            if (funcName) {
                // 计算行号和列号
                const lines = content.slice(0, match.index).split(/\r?\n/);
                const line = lines.length;
                const column = lines[lines.length - 1].length;

                functions[`$${funcName}`] = ["common", line, column];
            }
        }

        // 更新store中的函数信息
        if (!store.configs.globalLodash) {
            store.configs.globalLodash = {};
        }
        if (!store.configs.globalLodash.vars) {
            store.configs.globalLodash.vars = {};
        }
        if (!store.configs.globalLodash.files) {
            store.configs.globalLodash.files = {};
        }

        // 更新vars中的函数信息
        Object.assign(store.configs.globalLodash.vars, functions);
        // 更新files中的文件路径信息
        store.configs.globalLodash.files["common"] = path.relative(vscode.workspace.rootPath, commonTsPath);

        console.log(`Successfully scanned common.ts and found ${Object.keys(functions).length} functions`);
    } catch (error) {
        console.error("Error scanning common.ts file:", error);
    }
};

/**
 * 查找common.ts文件的位置
 * @returns {string|null} common.ts文件的绝对路径，找不到则返回null
 */
exports.findCommonTsFile = function () {
    if (!vscode.workspace.rootPath) {
        return null;
    }

    // 可能的common.ts文件位置
    const possiblePaths = [
        path.resolve(vscode.workspace.rootPath, "common.ts"),
        path.resolve(vscode.workspace.rootPath, "src", "common.ts"),
        path.resolve(vscode.workspace.rootPath, "static_vue2", "common.ts"),
        path.resolve(vscode.workspace.rootPath, "business_common", "common.ts")
    ];

    // 遍历所有可能的路径，返回第一个存在的文件
    for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
            return possiblePath;
        }
    }

    // 如果在项目根目录下找不到，尝试根据别名规则查找
    const aliasPath = path.resolve(vscode.workspace.rootPath, "static_vue2", "common.ts");
    if (fs.existsSync(aliasPath)) {
        return aliasPath;
    }

    return null;
};

/**
 * 设置文件监听器，当common.ts文件变化时重新扫描
 * @param {string} commonTsPath common.ts文件的绝对路径
 * @param {vscode.ExtensionContext} context VSCode扩展上下文，用于注册监听器
 */
exports.setupCommonTsWatcher = function (commonTsPath, context) {
    if (!commonTsPath) {
        return;
    }

    // 创建文件监听器
    const watcher = vscode.workspace.createFileSystemWatcher(
        vscode.Uri.file(commonTsPath).fsPath,
        false, // 忽略创建事件
        false, // 忽略更改事件
        false  // 忽略删除事件
    );

    // 监听文件变化
    const changeDisposable = watcher.onDidChange((uri) => {
        console.log(`common.ts file changed: ${uri.fsPath}`);
        exports.scanCommonTsFile(commonTsPath);
    });

    // 监听文件删除
    const deleteDisposable = watcher.onDidDelete(() => {
        console.log(`common.ts file deleted: ${commonTsPath}`);
    });

    // 监听文件创建（用于处理文件被删除后重新创建的情况）
    const createDisposable = watcher.onDidCreate((uri) => {
        console.log(`common.ts file created: ${uri.fsPath}`);
        exports.scanCommonTsFile(commonTsPath);
    });

    // 将监听器添加到上下文，以便在插件停用时有VSCode自动清理
    context.subscriptions.push(watcher, changeDisposable, deleteDisposable, createDisposable);
};