const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async (event) => {
  const songURL = event.body
  let lyrics;
  await axios.get(songURL).then((response) => {
    const $ = cheerio.load(response.data)
    lyrics = $('div[class="lyrics"]').text().trim()
  });

  if (lyrics) {
    lyrics = lyrics.split(/\r\n|\r|\n/)
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      payload: lyrics,
      type: "success",
      message: "Loaded all invoices successfully"
    })
  };
};