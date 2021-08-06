const axios = require('axios');
const cheerio = require('cheerio');

function getChildrenText (children) {
  text = []
  children.forEach(child => {
    if (child.type === 'text') {
      const cleanText = child.data.replace(/\]|\[|\)|\(/g,'')
      text.push(cleanText)
      // console.log(child.data)
    } else if (child.type === 'tag') {
      if (child.name === 'a') {
        if (child.children.length) {
          child.children.forEach(grandChild => {
            if (grandChild.children.length) {
              grandChild.children.forEach(greatGrandChild => {
                if (greatGrandChild.data) {
                  const cleanText = greatGrandChild.data.replace(/\]|\[|\)|\(/g,'')
                  text.push(cleanText)
                  // console.log(greatGrandChild.data)
                }
              })
            }
          })
        }
      }
    }
  })
  return text
}
exports.handler = async (event) => {
  const songURL = event.body
  console.log(songURL)
  if (songURL.includes('annotated')) {
    console.log('This one failed')
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        payload: ['Cant Find Lyrics :('],
        type: "fail"
      })
    };
  }
  let lyrics = []
  await axios.get(songURL).then((response) => {
    const $ = cheerio.load(response.data)
    // console.log($("div[class^='Lyrics__Container']").text())
    lyric_objs = Object.values(($("div[class^='Lyrics__Container']").get()))
    lyric_objs.forEach(obj => {
      // console.log(Object.keys(obj))
      if (obj.children.length) {
        const bar = getChildrenText(obj.children)
        lyrics = lyrics.concat(bar)
      }
    })
  })

  console.log(lyrics)

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      payload: lyrics,
      type: "success"
    })
  };
};
