let axios = require('axios')
let cheerio = require('cheerio')
const fs = require('fs')

let cookie = ''

function wait (ms = 2100) {
  return new Promise(
    (r) => setTimeout(() => r(), ms)
  )
}

setTimeout(async () => {
  // const gm = require('gm')

  // async function denoise (image, threshold = 40) {
  //   return new Promise((resolve, reject) => {
  //     gm(image)
  //       .threshold(threshold, '%')
  //       .write(image, function (err) {
  //         if (!err) {
  //           resolve()
  //         } else {
  //           reject(err)
  //         }
  //       })
  //   })
  // }

  // await denoise('0.bmp')


  // let Tesseract = require('tesseract.js')

  // let r = await Tesseract.recognize(
  //   'https://tesseract.projectnaptha.com/img/eng_bw.png',
  //   'eng',
  //   { logger: m => console.log(m) }
  // )
  // console.log(r)

  // await wait(10000)

  // return



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

    // 验证 获取cookie
    // 假设用户已经有了cookie
    let codestr = null

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
    if (codestr)
      postBody['codestr'] = codestr
    c = await axios.post(url, postBody, { headers })
    $ = cheerio.load(c.data)
    let downloads = $('a.blue')
    for (let download of downloads) {
      headers.Referer = url
      let href = $(download).attr('href')
      let c = await axios.get(`https://www.dlkoo.cc/down/${href}`, { headers, responseType: 'arraybuffer' })

      let pth = `dlkoo//${filePath}//`
      try {
        if (!fs.existsSync(pth)) {
          fs.mkdirSync(pth, { recursive: true })
        }
      } catch (e) {
        console.log(`path ${pth} create failed!!!`)
        continue
      }
      fs.writeFileSync(`${pth}//${fileName}.torrent`, c.data, 'binary')
    }

    delete headers.Referer
    delete headers.Origin
    delete headers.Cookie
    delete headers['Content-Type']
  }

  // 每个电影的详细页面
  let doMainPage = async (href) => {
    await wait()

    let url = `https://www.dlkoo.cc${href}`
    console.log(url)
    let c = await axios.get(url)
    let $ = cheerio.load(c.data)
    // let downloads = $('a[class="downtitle"]').attr('href')
    let downloads = $('a[class="downtitle"]')
    for (let download of downloads) {
      let href = $(download).attr('href')
      fileName = $(download).text()
      await doDownload(href, url)
    }
    // await doDownload(downloads, url)
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
