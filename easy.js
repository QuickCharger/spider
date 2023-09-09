let path = require('path')
let fs = require('fs')

let createPath = async (pth) => {
  try {
    if (!fs.existsSync(pth)) {
      fs.mkdirSync(pth, { recursive: true })
    }
  } catch (e) {
    console.log(`path ${pth} create failed!!!`)
    return false
  }
  return true
}

let save = async (pth, filename, content, utf8 = true) => {
  let r = await createPath(pth)
  if (!r)
    return false
  fs.writeFileSync(path.join(pth, filename), content, utf8 ? 'utf8' : 'binary')
  return true
}

let load = (pth, filename, defaul, utf8 = true) => {
  try {
    let content = fs.readFileSync(path.join(pth, filename), utf8 ? 'utf8' : 'binary')
    return content
  } catch (e) {
    console.log(e)
    return defaul
  }
  return ''
}

function sleep (ms = 1000, cb = null) {
  return new Promise(
    (r, j) => setTimeout(async () => {
      if (cb) {
        await cb()
      }
      r()
    }, ms)
  )
}



/**
 * @param {*} waitUntil
 *              load {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event}
 *                全部网页load，包含cs，js，img。 不包含异步加载！！！
 *              domcontentloaded  {@link https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event}
 *                HTML document全部解析，包含异步js加载。不等待img
 *              networkidle0 consider setting content to be finished when there are no more than 0 network connections for at least `500` ms
 *              networkidle2 consider setting content to be finished when there are no more than 2 network connections for at least `500` ms.
 * @returns 
 */
let newPageNeedBind = async (browser, { url, cookie = [], media = true, waitUntil = 'networkidle2', emulate = null, networkCondition = null, defaultTimeout = null }) => {
  let page = await browser.newPage()
  await page.setViewport({
    width: 1280,
    height: 1024,
    deviceScaleFactor: 1,
  })
  if (emulate)
    await page.emulate(emulate)
  if (networkCondition)
    await page.emulateNetworkConditions(networkCondition)
  if (defaultTimeout)
    await page.setDefaultNavigationTimeout(defaultTimeout)

  if (!media) {
    await page.setRequestInterception(true)
    page.on('request', (request) => {
      if (request.resourceType() === 'image' || request.resourceType() === 'media') {
        request.abort()
      } else {
        request.continue()
      }
    })
  }

  await page.setCookie(...cookie)
  await page.goto(url, { waitUntil })
  await page.addScriptTag({ url: 'https://cdn.bootcdn.net/ajax/libs/jquery/3.6.4/jquery.min.js' })
  // file: \node_modules\puppeteer-core\src\common\USKeyboardLayout.ts
  await page.keyboard.press("F12", { delay: 1000 })

  await page.evaluate(() => {
    // 闪烁
    window.customBlink = (css) => {
      let ele = $(css)
      $(window).scrollTop(ele.offset().top - $(window).height() / 2)
      ele.css("background", "pink")
    }

    window.findAll = (css, format = null, filter = null) => {
      if (format === null)
        format = (it) => {
          let ele = $(it)
          let rect = ele[0].getBoundingClientRect()
          return {
            id: it.id,
            className: it.className,
            name: it.name,
            x_page: ele.offset().left,
            y_page: ele.offset().top,
            height: ele.height(),
            width: ele.width(),
            x: rect.left,   // x_window
            y: rect.top  // y_window
          }
        }
      if (filter === null)
        filter = (it) => { return it }
      return $(css).toArray().filter(filter).map(format)
    }

    window.find = (css, format = null, filter = null) => {
      return window.findAll(css, format, filter)[0]
    }

    window.scrollCenter = async (css) => {
      let ele = $(css)
      await $(window).scrollTop(ele.offset().top - $(window).height() / 2 + ele.height() / 2)
      return window.find(css)
    }

    // 查找css并返回居中的位置
    window.findPosMid = (css) => {
      let items = $(css).toArray()
      console.log(items)
      return items.map(item => {
        return {
          y: $(item).offset().top + $(item).height() / 2,
          x: $(item).offset().left + $(item).width() / 2,
        }
      })
    }
  })


  // demo begin
  // 通过evaluate注入的函数能访问网页的环境 不能访问nodejs的环境
  // 导航后 注入消失
  await page.evaluate(() => {
    window.formatDayjs_1 = (rules) => {
      return new Date().format(rules)
    }
  })
  // 通过exposeFunction注入的函数能访问nodejs的环境 不能访问网页的环境
  // 导航后 注入依旧存在
  await page.exposeFunction('formatDayjs_2', (rules) => {
    let dayjs = require('dayjs')
    return dayjs().format(rules)
  })
  // demo end

  return page
}


module.exports = {
  createPath,
  save, load,
  sleep,
  newPageNeedBind
}
