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
    console.log($('div[class="Lyrics__Container-sc-1ynbvzw-6 krDVEH"]'))
    // lyrics = $('div[class="lyrics"]').text().trim()
    // lyrics =  $('div[class="Lyrics__Container-sc-1ynbvzw-6 krDVEH"]').text() // .trim()
    $('div[class="Lyrics__Container-sc-1ynbvzw-6 krDVEH"]').each(function (i, e) {
      for (const [key, value] of Object.entries(e.children)) {
        if (value.type === 'text') {
          lyrics.push(value.data)
        }
      }
    })
  })
  console.log(lyrics)
  // if (lyrics) {
  //   lyrics = lyrics.split(/\r\n|\r|\n/)
  // }
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