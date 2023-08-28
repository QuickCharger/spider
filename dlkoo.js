let fs = require('fs')
let path = require('path')
let axios = require('axios')
let cheerio = require('cheerio')
let puppeteer = require('puppeteer')

let cookie = ''

function wait (ms = 2100) {
  return new Promise(
    (r) => setTimeout(() => r(), ms)
  )
}

// 随便打开一个网址 目的是获取cookie
// return true 获取成功 默认修改cookie变量
async function doGetCookie () {
  let _getCookie = async () => {

    const browser = await puppeteer.launch({ headless: false })
    const page = await browser.newPage()
    page.setViewport({
      width: 1280,
      height: 1024,
      deviceScaleFactor: 1,
    })

    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36',
      'Referer': 'https://www.dlkoo.cc/down/2/2023/619911099.html',
    })

    await page.goto('https://www.dlkoo.cc/down/downfile.asp?did=546832')

    while (true) {
      // 等待用户输入验证码 页面会自动跳转
      await page.waitForNavigation({ timeout: 0 })

      // 页面带有.blue 表示提供了下载链接 应该是验证成功了
      const isSuccess = await page.evaluate(() => {
        return document.getElementsByClassName('blue').length != 0
      })

      if (isSuccess) {
        let c = await page.cookies()
        c = c[0]
        cookie = `${c.name}=${c.value}`
        break
      }

      await page.goBack()
      await page.reload()
    }

    await browser.close()
    return true
  }

  while (true) {
    try {
      let r = await _getCookie()
      if (r)
        return
    } catch (e) {
      console.log(e)
    }
  }
}

setTimeout(async () => {
  let filePath = ''
  let fileName = ''
  let headers = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    'Content-Type': 'application/x-www-form-urlencoded',
    //"Cookie": "",
    //"Referer": "",
  }

  // return true 成功下载到torrent
  // return false cookie失效 上层获取cookie
  let doDownload = async (href, refer) => {

    await wait()
    let url = `https://www.dlkoo.cc${href}`
    console.log(url)
    let did = href.split('did=')[1]
    headers.Referer = `${refer}`
    let c = await axios.get(url, { headers })
    let $ = cheerio.load(c.data)
    fs.writeFileSync('dl.log', c.data)
    let movid = $('input[id="movid"]').attr('value')

    await wait()
    headers.Referer = `${url}`
    headers.Origin = 'https://www.dlkoo.cc'
    headers.Cookie = cookie
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    url = `https://www.dlkoo.cc/down/downfile.asp?act=subb&n=${parseInt(10000000000 * Math.random())}`
    let postBody = {
      id: 1,
      did: +did,
      ac: 'b',
      movid: +movid,
    }
    c = await axios.post(url, postBody, { headers })
    if (c.data === '')
      return false
    $ = cheerio.load(c.data)
    let downloads = $('a.blue')
    for (let download of downloads) {
      headers.Referer = url
      let href = $(download).attr('href')
      let c = await axios.get(`https://www.dlkoo.cc/down/${href}`, { headers, responseType: 'arraybuffer' })

      let pth = path.join('dlkoo', filePath.replace(/\//g, ''))
      try {
        if (!fs.existsSync(pth)) {
          fs.mkdirSync(pth, { recursive: true })
        }
      } catch (e) {
        console.log(`path ${pth} create failed!!!`)
        continue
      }
      fs.writeFileSync(path.join(pth, `${fileName}.torrent`), c.data, 'binary')
    }

    delete headers.Referer
    delete headers.Origin
    delete headers.Cookie
    delete headers['Content-Type']
    return true
  }

  // 每个电影的详细页面
  let doMainPage = async (href) => {
    await wait()

    let url = `https://www.dlkoo.cc${href}`
    console.log(url)
    let c = await axios.get(url)
    let $ = cheerio.load(c.data)
    let downloads = $('a[class="downtitle"]')
    for (let download of downloads) {
      let href = $(download).attr('href')
      fileName = $(download).text()
      let r = await doDownload(href, url)
      if (r === false) {
        await doGetCookie()
        await doDownload(href, url)
      }
    }
  }

  for (let i = 0; i < 100; ++i) {
    let url = `https://www.dlkoo.cc/down/index.asp?page=${i}`
    let c = await axios.get(url)
    let $ = cheerio.load(c.data)
    let lis = $('#mymov').children().first().find('li')
    for (let i = 1; i < lis.length; ++i) {
      let tm = $(lis[i]).children().eq(0).text()
      let type = $(lis[i]).children().eq(1).text()
      let n = $(lis[i]).children().eq(2).text()
      let href = $(lis[i]).children().eq(2).find('a').attr('href')
      if (n.length === 0)
        continue
      console.log(tm, type, n)
      filePath = n
      await doMainPage(href)
    }
    break
  }

}, 1000)
