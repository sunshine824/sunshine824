import fs from "fs";
import util from "util";
import process from "child_process";

import { JSDOM } from "jsdom";

const exec = util.promisify(process.exec);

const USER_ID = "1706080132678621"; // 掘金用户 ID

// 1. 拉取页面: 使用 cur 拿到 html内容
const { stdout: body } = await exec(
  `curl https://juejin.cn/user/${USER_ID}/posts`
);

// 2. 使用 jsdom 解析 HTML
const dom = await new JSDOM(body);

// 3. 生成 html
const appendHtmlText = [
  ...dom.window.document.querySelectorAll(
    ".detail-list .post-list-box .entry-list .entry"
  ),
].reduce((total, ele) => {
  const date = ele
    .querySelector(".action-list .date")
    ?.textContent?.replace(/\s*/g, "");
  const like = ele
    .querySelector(".action-list .like")
    ?.textContent?.replace(/\s*/g, "");
  const view = ele
    .querySelector(".action-list .view")
    ?.textContent?.replace(/\s*/g, "");

  const link = ele.querySelector(".content-wrapper .title-row a.title");
  return `${total}\n<p>[${date}] [${view}阅读] <a href="https://juejin.cn${link?.getAttribute(
    "href"
  )}">${link?.textContent}</a></p>`;
}, "");

// 4. 读取 README, 并在 <!-- posts start --> 和 <!-- posts end --> 中间插入生成的 html
const README_PATH = new URL("./README.md", import.meta.url);
const res = fs
  .readFileSync(README_PATH, "utf-8")
  .replace(
    /(?<=\<\!-- posts start --\>)[.\s\S]*?(?=\<\!-- posts end --\>)/,
    `\n<div align="center">${appendHtmlText}\n</div>\n`
  );

// 5. 修改 README
fs.writeFileSync(README_PATH, res);
