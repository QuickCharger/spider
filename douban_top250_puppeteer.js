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
      let emulate = puppeteer.KnownDevices['iPhone 6']
      let networkCondition = puppeteer.PredefinedNetworkConditions['Fast 3G']
      let p = await newPageHeadless({
        url: li.href, useWindow: true, media: true,
        waitUntil: 'domcontentloaded',
        emulate: null,
        networkCondition: null,
        defaultTimeout: null
      })
      // let pt = await _browser.newPage()
      // pt.waitForResponse
      // pt.waitForNavigation()
      // pt.waitForSelector()

      // p.click()  移动到元素 模拟鼠标点击
      // p.focus()  移动到元素 边框突显
      // p.hover()  移动到元素 鼠标移动到元素
      // p.tap()    移动到元素 模拟触屏点击
      // p.type()   模拟用户键盘输入

      // p.addScriptTag()
      // p.content()
      // p.emulate()
      // p.emulateNetworkConditions()
      // p.evaluate()
      // p.exposeFunction()
      // p.goback()
      // p.goForward()
      // p.goto()
      // p.on()
      // p.once()
      // p.pdf()
      // p.reload()
      // p.screenshot()
      // p.select()   选择下拉列表
      // p.setDefaultNavigationTimeout()
      // p.setExtraHTTPHeaders()
      // p.setRequestInterception()
      // p.setViewport()
      // p.waitForNavigation()
      // p.waitForSelector()

      // await page.focus(`#${li.id}`)
      page.evaluate((id) => {
        window.customBlink(`#${id}`)
      }, li.id)
      let rank = await p.evaluate(() => {
        let rank = $('.ll.rating_num').text()
        return rank
      })
      // console.log(JSON.stringify(li))

      // 展开 class='unfold'
      {
        let all = await p.evaluate(() => {
          return window.findAll('.unfold')
        })
        for (let it of all) {
          let id = `#${it.id}`
          // await p.waitForSelector(id)
          let ppId = await p.evaluate((id) => {
            return $(id).parent().parent().attr('id')
          }, id)
          await p.click(id)
          // 点击后 会使parent.id 添加class='hidden' 表示新的加载结束
          await p.waitForSelector(`#${ppId}.hidden`)
        }
      }

      await createPath('douban')
      // 获取的图片有bug 图片内容有重复
      await p.screenshot({ path: Path.join('douban', `_${li.name}.png`), fullPage: true })
      // await p.pdf({ path: Path.join('douban', `_${li.name}.pdf`) })

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

    // await sleep(500)
  }

  await _browser.close()
}, 1000)
