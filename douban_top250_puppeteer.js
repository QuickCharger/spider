let axios = require('axios')
let cheerio = require('cheerio')
let puppeteer = require('puppeteer')
let { sleep } = require('./easy')

setTimeout(async () => {

  // 登陆！！！

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      // '--start-maximized',
      // '--start-fullscreen',
      '--window-size=1280,1024',
    ],
  })

  let newPage = async (url) => {
    let page = await browser.newPage()
    page.setViewport({
      width: 1280,
      height: 1024,
      deviceScaleFactor: 1,
    })

    await page.goto(url, { waitUntil: 'networkidle2' })
    await page.addScriptTag({ url: 'https://cdn.bootcdn.net/ajax/libs/jquery/3.6.4/jquery.min.js' })
    await page.waitForSelector('.nav-user-account')
    return page
  }

  let start = '?start=0&filter='
  while (start.length > 0) {
    let page = await newPage(`https://movie.douban.com/top250${start}`)

    let lis = await page.evaluate(() => {
      let ret = []
      let lis = $('.grid_view > li')
      for (let li of lis) {
        let rank = $(li).find('.item > .pic > em').text()
        let name = $(li).find('.item > .info > .hd > a > .title').eq(0).text()
        let href = $(li).find('.item > .info > .hd > a').attr('href')
        ret.push({ rank, name, href })
      }
      return ret
    })

    for (let li of lis) {
      let page = await newPage(li.href)
      let rank = await page.evaluate(() => {
        let rank = $('.ll.rating_num').text()
        return rank
      })
      console.log(rank)
    }

    start = await page.evaluate(() => {
      let nextPage = $('.thispage').nextAll().filter('a')
      if (nextPage.length > 0) {
        let href = nextPage.eq(0).attr('href')
        return href
      }
      return ''
    })

    await page.close()

    await sleep(500)
  }

  await browser.close()
}, 100)
