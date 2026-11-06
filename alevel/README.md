# BRS A Level Exam Schedule

A Level 查询作为主项目的子目录，共用根目录的 Deno、npm 配置、锁文件、本地服务器和 Netlify 部署流程。

在主项目根目录运行：

```bash
cd /Users/hehuang/Documents/examschedule
npm install
npm run dev
```

校内考试：http://127.0.0.1:5173/ 。A Level：http://127.0.0.1:5173/alevel/ 。

线上配置路径为 https://brsexam.approacher.org/alevel ，需要部署主项目后生效。

## 更新考表

编辑 `alevel/input.csv`，然后在根目录运行 `npm run generate-json:alevel` 并刷新页面。字段见 `alevel/docs/DATA_FORMAT.md`。当前为 2026 年 10–11 月考表，52 场、32 名学生、136 条报考记录。

`alevel/public/` 保存页面、浏览器脚本和静态依赖，根目录构建时复制到 `public/alevel/` 并生成查询数据；不要直接修改发布目录。修改考季时同步更新 `alevel/public/index.html` 和 `alevel/public/web/student.js` 中的提示。

## 调试和验证

VS Code 打开主项目根目录，按 F5 选择 A Level 配置。断点设置在 `alevel/public/web/student.js` 或发布副本 `public/alevel/web/student.js`，修改源文件后重新运行 `npm run generate-json:alevel`。

```bash
npm run check:alevel
npm run test:alevel
```

原作者 plushugh，参考站维护者 SteveHHuang。
