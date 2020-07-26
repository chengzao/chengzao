const fs = require("fs");
const path = require("path");
// @url: https://aui.github.io/art-template/zh-cn/docs/api.html
const template = require("art-template");
const axios = require("axios");
require("dotenv").config();

// https://developer.github.com/v4/explorer/
const GITHUB_URL = "https://api.github.com/graphql";
const TOKEN = process.env.ACCESS_TOKEN;

const tpl = path.join(__dirname, "./template/README.md");
const outputDir = path.join(__dirname, "./output/README.md");
const rootDir = path.join(__dirname, "./README.md");

const tplContent = fs.readFileSync(tpl, { encoding: "utf-8" });

function request(data, headers = {}) {
  return axios({
    url: GITHUB_URL,
    method: "post",
    headers,
    data,
  });
}

const fetcher = (variables, token) => {
  return request(
    {
      query: `
      query userInfo($login: String!) {
        user(login: $login) {
            bio
            avatarUrl(size: 10)
            name
            url
        }
      }
      `,
      variables,
    },
    {
      Authorization: `bearer ${token}`,
    }
  );
};

fetcher({ login: "chengzao" }, TOKEN)
  .then((res) => {
    const rs = res.data.data;
    const outputContent = template.render(tplContent, {
      url: rs.user.url,
      avatarUrl: rs.user.avatarUrl,
    });

    fs.writeFileSync(outputDir, outputContent, { encoding: "utf-8" });
    const isExistsFile = fs.existsSync(outputDir);

    if (isExistsFile) {
      fs.copyFileSync(outputDir, rootDir);
    }
  })
  .catch((error) => console.log("error: ", error.message));
