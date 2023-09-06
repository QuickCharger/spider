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
 *              load https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event
 *                全部网页load，包含cs，js，img。 不包含异步加载！！！
 *              domcontentloaded  https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event
 *                HTML document全部解析，包含异步js加载。不等待img
 *              networkidle0 consider setting content to be finished when there are no more than 0 network connections for at least `500` ms
 *              networkidle2 consider setting content to be finished when there are no more than 2 network connections for at least `500` ms.
 * @returns 
 */
let newPageNeedBind = async (browser, { url, cookie = [], media = true, waitUntil = 'networkidle2' }) => {
  let page = await browser.newPage()
  page.setViewport({
    width: 1280,
    height: 1024,
    deviceScaleFactor: 1,
  })

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

  // to use
  // await page.evaluate(()=>{ window.customBlink(...)})
  await page.evaluate(() => {
    window.customBlink = (id, fadeOutTime = 500, fadeInTime = 500, delay = 0, callback = null) => {
      console.log(`blink id ${id}`)
      let ele = $(`#${id}`) // 选择你的元素
      // ele.animate({
      //   backgroundColor: 'pink' // 改变底色为红色
      // }, 500) // 这个动画持续0.5秒
      //   .animate({
      //     backgroundColor: '#ffffff' // 改变底色回到白色
      //   }, 500)
      // $(window).scrollTop(ele.offset().top - $(window).height() / 3)
      $(window).scrollTop(ele.offset().top - $(window).height() / 2)
      ele.css("background", "pink")

      // setInterval(function () {
      //   $element.animate({
      //     backgroundColor: '#ff0000' // 改变到的底色
      //   }, 500) // 半秒钟淡出
      //     .animate({
      //       backgroundColor: '#ffffff' // 原始的底色
      //     }, 500) // 半秒钟淡入
      // }, 1000) // 每秒钟重复一次
    }
  })
  // await page.exposeFunction('customBlink', (id, fadeOutTime = 500, fadeInTime = 500, delay = 0, callback = null) => {
  //   $(id).fadeOut(fadeOutTime, function () {
  //     $(this).fadeIn(fadeInTime, function () {
  //       setTimeout(() => {
  //         $(this).fadeOut(fadeOutTime, function () {
  //           $(this).fadeIn(fadeInTime, function () {
  //             customBlink(this, fadeOutTime, fadeInTime, delay, callback)
  //           })
  //         })
  //       }, delay)
  //     })
  //   })
  //   if (callback) {
  //     callback()
  //   }
  // })

  return page
}


module.exports = {
  createPath,
  save, load,
  sleep,
  newPageNeedBind
}
