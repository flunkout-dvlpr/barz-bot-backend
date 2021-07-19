const axios = require('axios');
const cheerio = require('cheerio');

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
    lyric_objs = Object.values(($('div[class*="Lyrics__Container"]').get()))
    lyric_objs.forEach(obj => {
      for (const [key, value] of Object.entries(obj.children)) {
        if (value.type === 'text') {
          const bar = value.data.split(/\r\n|\r|\n/)
          lyrics.push(bar)
        }
      }
    })
  })
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