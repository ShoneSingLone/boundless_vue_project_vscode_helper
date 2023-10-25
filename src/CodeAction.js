/**
 * @type import("vscode").CodeActionProvider
 */
exports.CodeAction = class CodeAction {
  provideCodeActions(document, range) {
    // 在这里实现代码补全功能的逻辑，并返回一个Command对象的数组
    // Command对象包含了执行代码补全操作的相关信息，如名称、执行函数等
    // 如果找不到代码补全操作，则返回一个空数组
    // 请根据实际情况进行修改和扩展
    const codeActions = [];

    const addCodeActionCommand = (label, command, range) => {
      codeActions.push({
        label,
        command,
        arguments: [document.uri, range],
      });
    };

    if (range) {
      const words = document.getText(range).split(/\s+/);
      if (words.length > 0) {
        addCodeActionCommand(
          "Add Import for " + words[0],
          "editor.action.addImportStatement",
          range,
        );
      }
    } else {
      addCodeActionCommand(
        "Add Import for " + document.getText(),
        "editor.action.addImportStatement",
        undefined,
      );
    }

    return codeActions;
  }
};
