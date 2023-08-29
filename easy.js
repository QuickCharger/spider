const { writeFile, readFile } = require('fs/promises')

const saveCookie = async (page, website) => {
  await page.waitForFunction(() => {
    if (window.x) return true
  }, { timeout: 0 })

  const cookie = await page.cookies()

  // 这里统一把所有网站的cookie写入cookies文件夹里
  await writeFile(`./cookies/${website}.json`, JSON.stringify(cookie))
}

const getCookie = async (website) => {
  const path = `./cookies/${website}.json`
  const data = await readFile(`./cookies/${website}.json`, {
    flag: 'a+'
  })

  // 这里可以再加入判断cookie是否过期,如果过期,则也直接return的逻辑
  if (!data.toString()) return

  return JSON.parse(data.toString())
}

function sleep (ms = 1000) {
  return new Promise(
    (r, j) => setTimeout(() => r(), ms)
  )
}



module.exports = {
  saveCookie, getCookie,
  sleep
}
