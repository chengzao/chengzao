// const GITEE_BASE = 'https://gitee.com/cxyz/imgbed/raw/img'
// @url: https://github.com/topics
// const TOPICS_BASE = 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics'

const TOPICS_BASE =
  "https://cdn.jsdelivr.net/gh/chengzao/chengzao@dev/icons";

const TOPICS = [
  {
    url: `${TOPICS_BASE}/html.png`,
    name: 'html'
  },
  {
    url: `${TOPICS_BASE}/javascript.png`,
    name: 'javascript'
  },
  {
    url: `${TOPICS_BASE}/vue.png`,
    name: 'vue'
  },
  {
    url: `${TOPICS_BASE}/react.png`,
    name: 'react'
  },
  {
    url: `${GITEE_BASE}/wxminapp.png`,
    name: '微信小程序'
  },
  {
    url: `${TOPICS_BASE}/nodejs.png`,
    name: 'nodejs'
  },
  {
    url: `${TOPICS_BASE}/webpack.png`,
    name: 'webpack'
  },
  {
    url: `${TOPICS_BASE}/git.png`,
    name: 'git'
  },
]

module.exports = TOPICS