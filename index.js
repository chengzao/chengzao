const fs = require("fs");
const path = require("path");
// @url: https://aui.github.io/art-template/zh-cn/docs/api.html
const template = require("art-template");
const axios = require("axios");
const exec = require('@actions/exec');
require("dotenv").config();

// @url: https://developer.github.com/v4/explorer/
const GITHUB_URL = "https://api.github.com/graphql";

// @url: https://github.com/settings/tokens
const TOKEN = process.env.ACCESS_TOKEN;
const USER = "chengzao";

const tpl = path.join(__dirname, "./template/README.md");
const outputDir = path.join(__dirname, "./output/README.md");
const rootDir = path.join(__dirname, "./README.md");

// read file
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
            url
        }
        viewer {
          repositories(orderBy: {field: UPDATED_AT, direction: DESC}, first: 3) {
            totalCount
            nodes {
              name
              url
              updatedAt
            }
          }
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

fetcher({ login: USER }, TOKEN)
  .then((res) => {
    const rs = res.data.data;
    const repositories = rs.viewer.repositories;

    // render data
    const outputContent = template.render(tplContent, {
      url: rs.user.url,
      user: USER,
      bio: rs.user.bio,
      nodes: repositories.nodes,
    });

    // write file
    fs.writeFileSync(outputDir, outputContent, { encoding: "utf-8" });

    // exist file
    const isExistsFile = fs.existsSync(outputDir);

    if (isExistsFile) {
      // copy file
      fs.copyFileSync(outputDir, rootDir);

      try {
        publishReadme()
      } catch (error) {
        console.log('run git error')
      }
    }
  })
  .catch((error) => console.log("error: ", error.message));

  async function publishReadme(){
    await exec.exec('git', ['--version']);
    await exec.exec('git', ['config', '--global', 'user.name', '"chengzao"']);
    await exec.exec('git', ['config', '--global', 'user.email', '"czhlink@163.com"']);
    await exec.exec('git', ['add', 'README.md']);
    await exec.exec('git', ['commit','-am', 'Update: README.md']);
    await exec.exec('git', ['push', 'origin', 'master']);
  }