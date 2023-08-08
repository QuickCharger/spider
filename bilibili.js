let axios = require('axios')
let cheerio = require('cheerio')

setTimeout(async () => {
  let doJob = async (att) => {
    let url = `https://www.bilibili.com/video/BV1cz4y1t7Hy/?vd_source=504182bab3632e1460445acee2800d45`
    let c = await axios.get(url)
    let $ = cheerio.load(c.data)
    console.log(c.data)
  }

  await doJob()
}, 100)
