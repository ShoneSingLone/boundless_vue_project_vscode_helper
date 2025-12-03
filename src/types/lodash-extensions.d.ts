// src/types/lodash-extensions.d.ts
declare module 'lodash' {
  interface LoDashStatic {
    // 声明所有可能的自定义属性为任意类型
    [key: string]: any;
  }
}

// 或者更具体地，声明一个全局的 _ 变量
declare global {
  interface Window {
    _: import('lodash').LoDashStatic & {
      // 声明所有可能的自定义属性为任意类型
      [key: string]: any;
    };
  }
  
  // 如果 _ 是直接在全局作用域的变量
  var _: import('lodash').LoDashStatic & {
    // 声明所有可能的自定义属性为任意类型
    [key: string]: any;
  };
}

export {};