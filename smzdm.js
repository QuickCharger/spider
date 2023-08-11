let axios = require('axios')
let cheerio = require('cheerio')

function wait (ms = 500) {
  return new Promise(
    (r) => setTimeout(() => r(), ms)
  )
}

setTimeout(async () => {
  let headers = {
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Connection": "keep-alive",
    "Cookie": "带上cookie 就能获取到和主页一样的值",
    "Host": "www.smzdm.com",
    "Referer": "https://www.smzdm.com/",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    "X-Requested-With": "XMLHttpRequest",
    "sec-ch-ua": '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
    "sec-ch-ua-mobile": "?0",
    'sec-ch-ua-platform': '"Windows"',
  }

  let doJob = async (att = '') => {
    let url = `https://www.smzdm.com/homepage/json_more?timesort=${(new Date().getTime() / 1000).toFixed(0)}&p=1&past_num=20`
    let c = null
    let $ = null
    try {
      c = await axios.get(url, { headers })
    } catch (e) {
      console.log(e)
      return
    }
    $ = cheerio.load(c.data)

    console.log(c.data.data.map(it => `id ${it.article_id} ${new Date(it.timesort * 1000).toLocaleString()}   ${it.article_title}`).join('\n'))
    console.log(`${new Date().getTime()}`)

    await wait()
    doJob()
  }

  await doJob()
}, 100)
