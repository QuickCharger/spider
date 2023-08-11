let axios = require('axios')
let cheerio = require('cheerio')

function wait (ms = 500) {
  return new Promise(
    (r) => setTimeout(() => r(), ms)
  )
}

setTimeout(async () => {
  let r = []

  let headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Cookie': '写了cookie 就不会有登陆提示',
    'Host': 'movie.douban.com',
    'Pragma': 'no-cache',
    'Referer': 'https://open.weixin.qq.com/',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'cross-site',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'sec-ch-ua': '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
  }
  headers = null

  let getScore = async (url) => {
    let c = await axios.get(url, { headers })
    await wait()
    let $ = cheerio.load(c.data)
    return $('.rating_num').text()
  }

  let doJob = async (att = '') => {
    let url = `https://movie.douban.com/top250${att}`
    let c = await axios.get(url, { headers })
    let $ = cheerio.load(c.data)
    let items = $('.grid_view').find('li')
    for (let item of items) {
      let rank = $(item).find('em').text()
      let title = $(item).find('.title').eq(0).text()
      let detailUrl = $(item).find('.hd').children().eq(0).attr('href')
      let score = await getScore(detailUrl)
      await wait()
      console.log(rank, title, score)
    }
    let nextPage = $('.thispage').nextAll().filter('a')
    if (nextPage.length > 0) {
      let href = nextPage.eq(0).attr('href')
      await doJob(href)
    }
  }

  await doJob()
  // console.log(r)
}, 100)
