let axios = require('axios')
let cheerio = require('cheerio')

function wait (ms = 500) {
  return new Promise(
    (r) => setTimeout(() => r(), ms)
  )
}

setTimeout(async () => {
  let headers = {
  }

  let doJob = async (att = '') => {
    let url = `https://www.smzdm.com/homepage/json_more?timesort=${(new Date().getTime() / 1000).toFixed(0)}&p=0&past_num=0`
    let c = null
    let $ = null
    try {
      c = await axios.get(url, { headers })
    } catch (e) {
      console.log(e)
      return
    }
    $ = cheerio.load(c.data)

    console.log(c.data.data.map(it => `id ${it.article_id} ${new Date(it.timesort * 10).toLocaleString()}   ${it.article_title}`).join('\n'))
    console.log(`${new Date().getTime()}`)

    await wait()
    doJob()
  }

  await doJob()
}, 100)
