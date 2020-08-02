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
const UTCCHINA = 8 * 3600 * 1000;
const TOPICS = require('./config');

// @return minutes
const ZONEOFFSET = Math.abs(new Date().getTimezoneOffset());

// mkdir output dir
const outputDir = path.join(__dirname,'./output')
if(!fs.existsSync(outputDir)){
  fs.mkdirSync(outputDir)
}

// file path
const tpl = path.join(__dirname, "./template/README.md");
const ouputPath = path.join(__dirname, "./output/README.md");

// read readme tpl file
const tplContent = fs.readFileSync(tpl, { encoding: "utf-8" });

// request 
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
  let chinaLocal = ZONEOFFSET == 480 ? time : new Date(time).getTime() + UTCCHINA
  let date = new Date(chinaLocal)
  let o = {
    'Y+': date.getFullYear(), // year
    'M+': date.getMonth() + 1, // month
    'D+': date.getDate(), // day
    'h+': date.getHours(), // hour
    'm+': date.getMinutes(), // minutes
    's+': date.getSeconds(), // seconds
    'q+': Math.floor((date.getMonth() + 3) / 3), // quarterly
    S: date.getMilliseconds(), // Millisecond
  }
  for (let k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        o[k] < 10 ? '0' + o[k] : o[k],
      )
    }
  }
  return fmt
};

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
    let runTime = new Date();
    runTime = ZONEOFFSET == 480 ? runTime : runTime.getTime() + UTCCHINA;
    // template render data
    const outputContent = template.render(tplContent, {
      url: rs.user.url,
      nodes: repositories.nodes.filter(item => item.name !== 'chengzao'),
      runTime: runTime,
      topics: TOPICS
    });

    // write readme.md content
    fs.writeFileSync(ouputPath, outputContent, { encoding: "utf-8" });
  })
  .catch((error) => console.log("error: ", error.message));
