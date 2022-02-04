const fs = require("fs");
const path = require("path");
// @url: https://aui.github.io/art-template/zh-cn/docs/api.html
const template = require("art-template");
const axios = require("axios");
const dayjs = require('dayjs');
require("dotenv").config();

// @url: https://developer.github.com/v4/explorer/
const GH_API = "https://api.github.com/graphql";

// @url: https://github.com/settings/tokens
const TOKEN = process.env.ACCESS_TOKEN;
const TOPICS = require('./config');

// file path
const tpl = path.join(__dirname, "./template/README.md");
const ouputPath = path.join(__dirname, "./output/README.md");
const corn_yml = path.join(__dirname,'./template/corn.yml')
const workflow_dir = path.join(__dirname,'./output/.github/workflows')

// mkdir output dir
function mkdirSync(dirname) {  
  if (fs.existsSync(dirname)) {  
      return true;  
  } else {  
      if (mkdirSync(path.dirname(dirname))) {  
          fs.mkdirSync(dirname);  
          return true;  
      }  
  }
}

try {
  mkdirSync(workflow_dir)
  fs.copyFileSync(corn_yml, path.join(workflow_dir, 'corn.yml'))
} catch (error) {
  console.log('mkdir init error.')
}

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
  return dayjs(time).format(fmt)
};

const query = `
  query userInfo($login: String!, $num: Int!) {
    user(login: $login) {
        url
    }
    viewer {
      list:repositories(orderBy: {field: UPDATED_AT, direction: DESC}, first: $num, privacy: PUBLIC) {
        totalCount
        nodes {
          name
          url
          isPrivate
          updatedAt
        }
      }
    }
  }
  `

// fetch func
const fetcher = (variables, token) => {
  return request({query,variables},{Authorization: `bearer ${token}`});
};

async function run() {
    try {
      const res = await fetcher({ login: 'chengzao', num: 5 }, TOKEN)
      const rs = res.data.data;
      const repositories = rs.viewer.list;
      let runTime = new Date();
      // template render data
      let nodes = repositories.nodes.filter(item => item.name !== 'chengzao')
      nodes = nodes.length > 3 ? nodes.slice(0,3) : nodes;
      const outputContent = template.render(tplContent, {
        url: rs.user.url,
        nodes: nodes,
        runTime: runTime,
        topics: TOPICS
      });
      // write readme.md content
      fs.writeFileSync(ouputPath, outputContent, { encoding: "utf-8" });
    } catch (error) {
      throw new Error('runTime: ',error.message)
    }
}

run()
