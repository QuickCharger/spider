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
    "Cookie": "r_sort_type=time",    // r_sort_type=time|score
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

  let p = 0
  let pastNum = 0
  let doJob = async () => {
    let url = `https://www.smzdm.com/homepage/json_more?&p=${p}&past_num=${pastNum}`
    console.log(url)
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
    // let minTimesort = c.data.data[0].timesort
    // c.data.data.map(it => {
    //   if (minTimesort > it.timesort)
    //     minTimesort = it.timesort
    //   return it
    // })

    ++p
    pastNum += c.data.data.length
    await wait(1000)
    doJob()
  }

  // 先获取https://www.smzdm.com/的数据， 然后再通过/homepage/json_more获取更多数据
  let url = `https://www.smzdm.com/`
  let c = await axios.get(url, { headers })
  let $ = cheerio.load(c.data)
  let lis = $('#feed-main-list').find('li')
  for (let li of lis) {
    let title = $(li).find('div').first().find('div').eq(1).find('h5').first().find('a').text().trim()
    console.log(title)
  }

  p = 2
  pastNum = lis.length
  await doJob()
}, 100)
