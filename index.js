const fs = require("fs");
const path = require("path");
// @url: https://aui.github.io/art-template/zh-cn/docs/api.html
const template = require("art-template");
const axios = require("axios");
const exec = require('@actions/exec');
require("dotenv").config();

// @url: https://developer.github.com/v4/explorer/
const GH_API = "https://api.github.com/graphql";

// @url: https://github.com/settings/tokens
const TOKEN = process.env.ACCESS_TOKEN;
const GH_REF = "github.com/chengzao/chengzao.git";
const TOPICS = require('./config');

// file path
const tpl = path.join(__dirname, "./template/README.md");
const outputDir = path.join(__dirname, "./output/README.md");
const rootDir = path.join(__dirname, "./README.md");


// read readme tpl file
const tplContent = fs.readFileSync(tpl, { encoding: "utf-8" });

function request(data, headers = {}) {
  return axios({
    url: GH_API,
    method: "post",
    headers,
    data,
  });
}

// @url:https://aui.github.io/art-template/zh-cn/docs/syntax.html
template.defaults.imports.dateFormat = function (time, fmt) {
  var date = new Date(time)
  var o = {
    'Y+': date.getFullYear(), // year
    'M+': date.getMonth() + 1, // month
    'D+': date.getDate(), // day
    'h+': date.getHours(), // hour
    'm+': date.getMinutes(), // minutes
    's+': date.getSeconds(), // seconds
    'q+': Math.floor((date.getMonth() + 3) / 3), // quarterly
    S: date.getMilliseconds(), // Millisecond
  }
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        o[k] < 10 ? '0' + o[k] : o[k],
      )
    }
  }
  return fmt
};

// publish readme.md to github 
async function publishReadme () {
  await exec.exec('git', ['--version']);
  await exec.exec('git', ['config', '--global', 'user.name', '"chengzao"']);
  await exec.exec('git', ['config', '--global', 'user.email', '"czhlink@163.com"']);
  await exec.exec('git', ['add', 'README.md']);
  await exec.exec('git', ['commit', '-am', 'actions update: README.md']);
  // await exec.exec('git', ['push','--force','--quiet', `https://${TOKEN}@${GH_REF}`, 'master']);
  await exec.exec('git', ['subtree','push','--force','--quiet','--prefix=output', `https://${TOKEN}@${GH_REF}`, 'master']);
}

// fetch func
const fetcher = (variables, token) => {
  return request(
    {
      query: `
      query userInfo($login: String!) {
        user(login: $login) {
            url
        }
        viewer {
          repositories(orderBy: {field: UPDATED_AT, direction: DESC}, first: 4) {
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

// do
fetcher({ login: 'chengzao' }, TOKEN)
  .then((res) => {
    const rs = res.data.data;
    const repositories = rs.viewer.repositories;
    const runTime = new Date()

    // template render data
    const outputContent = template.render(tplContent, {
      url: rs.user.url,
      nodes: repositories.nodes.slice(1),
      runTime: runTime,
      topics: TOPICS
    });

    // write readme.md content
    fs.writeFileSync(outputDir, outputContent, { encoding: "utf-8" });

    // exist file
    const isExistsFile = fs.existsSync(outputDir);

    if (isExistsFile) {
      // copy output/readme.md file to root dir
      fs.copyFileSync(outputDir, rootDir);
      console.log('build successed!')
      try {
        publishReadme()
      } catch (error) {
        console.log('run git error')
      }
    }
  })
  .catch((error) => console.log("error: ", error.message));

