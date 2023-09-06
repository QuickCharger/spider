let axios = require('axios')
let cheerio = require('cheerio')
let puppeteer = require('puppeteer')
let easy = require('./easy.js')
let Path = require('path')
let { createPath, save, sleep, newPageNeedBind } = easy

let needLogin = false

setTimeout(async () => {

  let _browser = await puppeteer.launch({
    headless: false,
    args: [
      // '--start-maximized',
      // '--start-fullscreen',
      '--window-size=1280,1024',
    ],
  })
  let _browser_headless = await puppeteer.launch({ headless: 'new' })

  let newPage = newPageNeedBind.bind(null, _browser)
  let newPageHeadless = newPageNeedBind.bind(null, _browser_headless)

  let start = '?start=0&filter='
  while (start.length > 0) {
    let cookie = easy.load('douban', 'cookie.txt', JSON.stringify([]))
    let page = await newPage({ url: `https://movie.douban.com/top250${start}`, cookie: JSON.parse(cookie), media: true, waitUntil: 'domcontentloaded' })

    // 等待登陆
    if (needLogin) {
      await page.evaluate(() => {
        window.alert('先登陆')
      })
      await page.waitForSelector('.nav-user-account', { timeout: 0 })
      let cookie = await page.cookies()
      await easy.save('douban', 'cookie.txt', JSON.stringify(cookie))
    }

    let lis = await page.evaluate(() => {
      let ret = []
      let lis = $('.grid_view > li').toArray()
      for (let li of lis) {
        let rank = $(li).find('.item > .pic > em').text()
        let name = $(li).find('.item > .info > .hd > a > .title').eq(0).text()
        let href = $(li).find('.item > .info > .hd > a').attr('href')
        let id = 'id' + Math.random().toString(36).substr(2, 9) // 创建一个随机ID 不能数字开头 所以前面加'id'
        li.setAttribute('id', id)
        ret.push({ rank, name, href, id })
      }
      return ret
    })

    for (let li of lis) {
      let p = await newPageHeadless({ url: li.href, useWindow: true, media: true, waitUntil: 'domcontentloaded' })
      // await page.$eval(`#${li.id}`, (li) => {
      //   // console.log(li)
      //   // return
      //   window.customBlink(li)
      // })
      page.evaluate((id) => {
        window.customBlink(id)
      }, li.id)
      let rank = await p.evaluate(() => {
        let rank = $('.ll.rating_num').text()
        return rank
      })
      console.log(JSON.stringify(li))
      await createPath('douban')
      await p.screenshot({ path: Path.join('douban', `_${li.name}.png`), fullPage: true })
      await p.close()
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

  await _browser.close()
}, 1000)
