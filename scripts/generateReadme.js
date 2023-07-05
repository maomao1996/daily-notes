const fs = require('fs-extra')
const client = require('octonode').client()

const USERNAME = 'maomao1996'
const REPO_NAME = 'daily-notes'
const REPO_URL = `${USERNAME}/${REPO_NAME}`

const repo = client.repo(REPO_URL)
const search = client.search()

const MD_HEADER = `# daily-notes

日常笔记记录（零零散散啥都记系列）

> 为了更好的浏览体验，已同步到[茂茂物语](https://notes.fe-mm.com/daily-notes/)
>
> [新写一篇小笔记](https://github.com/maomao1996/daily-notes/issues/new)
`

const MD_FOOTER = `\n`

function formatTime(time) {
  return time.replace(/T.*$/, '')
}

// 获取传入时间的 issues 信息
async function getIssues(time) {
  const [issuesResult] = await search.issuesAsync({
    page: 1,
    per_page: 100,
    sort: 'created-desc',
    q: `repo:${REPO_URL} type:issue author:${USERNAME} created:${time}`
  })

  return { ...issuesResult, year: time }
}

// 生成 issue 列表
function generateIssues({ year, total_count, items }) {
  const str = `\n\n## ${year} 年 (共计 ${total_count} 篇)\n\n`
  const issueStr = items
    .map(
      (issue, index) =>
        `${index + 1}. ${formatTime(issue.created_at)} —— [${issue.title}](${issue.html_url})`
    )
    .join('\n\n')

  return str + issueStr
}

;(async () => {
  try {
    // 获取仓库信息
    const [infoResult] = await repo.infoAsync()

    // 年份信息
    const currentYear = new Date().getFullYear()
    const createYear = infoResult.created_at.substr(0, 4)

    const issuesRequest = []
    for (let year = currentYear; year >= createYear; year--) {
      issuesRequest.push(getIssues(year))
    }
    const issuesResult = await Promise.all(issuesRequest)

    // 组装 MD 头部
    let md = MD_HEADER

    if (issuesResult.length) {
      md += `\n共计 **${issuesResult.reduce(
        (total, current) => total + current.total_count,
        0
      )}** 篇（上次更新: ${formatTime(issuesResult[0].items[0].created_at)}）`
    }

    // 组装文章列表
    for (const item of issuesResult) {
      if (item.total_count) {
        md += generateIssues(item)
      }
    }

    // 组装 MD 尾部
    md += MD_FOOTER

    // 写入 README.md 文件
    fs.writeFile('README.md', md, 'utf8')
      .then(() => {
        console.log('README.md 文件创建成功')
      })
      .catch(() => {
        console.log('README.md 文件创建失败')
      })
  } catch (error) {
    console.log('catch error :>> ', error)
  }
})()
