# [boundless-vue-helper](https://marketplace.visualstudio.com/items?itemName=ShoneSingLone.boundless-vue-helper)

npm install -g @vscode/vsce
vsce package
vsce login
vsce publish patch, minor, or major

## alias：跳转对应文件

- configs.boundlessHelper.js 才会启动插件探测 (package.json 同目录)
- 通用的配置
  ![](extension/20231026113734.png)

```json
"useBoundlessVue": {
    "alias": {
      "^/common/": "/static_vue2_element/common/"
    }
  }
```

- `@`是默认`business_**`文件夹下的资源（个人项目专用）
  - 同名的`@/entry.vue` 在 `business_app/` 和 `business_doc/下`，跳转各自对应的文件

## alias 跳转规则

- 引号 " ' ` 内部的 会尝试添加 js 后缀，如果是 bounndless 的组件，肯定是带.vue 后缀的

## \_.$importVue

\_.$importVue 导入的是 vue 单文件。默认导出是 default 文件名就是变量名

- 目前只支持单个导出；
- 多个导出自己手工添加吧

开启后，引号内以`.vue`结尾的字符串都会被探测，满足 alias 映射要求的会自动拼接项目 workspace rootPath

## 代码片段

- lodash
- xsfc SFC 模板（基础款）
- ximv \_.$importVue

### API

> [vscode-path-alias](https://github.com/IWANABETHATGUY/vscode-path-alias)

VSCode CodeActionProvider 是一个用于提供代码修复功能的插件。它可以帮助用户自动修复代码中的错误、提供代码重构建议以及其他编辑器建议。

### context.workspaceState.get('boundlessAutoImportConfigs')

```js
//获取配置信息
context.workspaceState.get("boundlessAutoImportConfigs");
//更新
context.workspaceState.update("boundlessAutoImportConfigs", {});
```
