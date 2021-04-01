const fs = require('fs-extra')
const client = require('octonode').client()
const repo = client.repo('maomao1996/daily-notes')

let md = `# daily-notes

日常笔记记录（零零散散啥都记系列）
`

function formatTime(time) {
  return time.replace(/T.*$/, '')
}

;(async () => {
  try {
    // 获取 issues 列表
    const [issues] = await repo.issuesAsync({
      page: 1,
      per_page: 100,
      sort: 'created-asc'
    })

    // 组装列表内容
    issues.forEach((issue) => {
      md += `\n- [${issue.title}](${issue.html_url}) —— ${formatTime(
        issue.created_at
      )}\n`
    })

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
