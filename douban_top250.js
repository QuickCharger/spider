let axios = require('axios')
let cheerio = require('cheerio')

setTimeout(async () => {
  let r = []

  let getScore = async (url) => {
    let c = await axios.get(url)
    let $ = cheerio.load(c.data)
    return $('.rating_num').text()
  }

  let doJob = async (att) => {
    let url = `https://movie.douban.com/top250${att ? att : ''}`
    let c = await axios.get(url)
    let $ = cheerio.load(c.data)
    let items = $('.grid_view').find('li')
    for (let item of items) {
      let rank = $(item).find('em').text()
      let title = $(item).children().eq(0).children().eq(1).children().eq(0).children().eq(0).children().eq(0).text()
      let detailUrl = $(item).find('.hd').children().eq(0).attr('href')
      let score = await getScore(detailUrl)
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
