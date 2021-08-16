const axios = require('axios');
const cheerio = require('cheerio');


function extractElementsText (nodes) {
  let text = []
  nodes.forEach(node => {
    if (node.data) {
      // console.log(node.data)
      text.push(node.data)
    } else if (node.children.length) {
      console.log('Note: Nested nodes found! Node -> @sub1Node')
      node.children.forEach(sub1Node => {
        if (sub1Node.data) {
          // console.log(sub1Node.data)
          text.push(sub1Node.data)
        } else if (sub1Node.children.length) {
          console.log('WARNING: Additional nested nodes found! Node -> sub1Node -> @sub2Node')
          sub1Node.children.forEach(sub2Node => {
            if (sub2Node.type === 'text') {
              // console.log('text @sub2Node')
              if (sub2Node.data) {
                // console.log(sub2Node.data)
                text.push(sub2Node.data)
              }
            } else if (sub2Node.type === 'tag') {
              // console.log('tag @sub2Node')
              if (sub2Node.children.length) {
                console.log('WARNING: MORE Additional nested nodes found! Node -> sub1Node -> sub2Node -> @sub2Node')
                sub2Node.children.forEach(sub3Node => {
                  if (sub3Node.data) {
                    // console.log(sub3Node.data)
                    text.push(sub3Node.data)
                  }
                })
              } 
            } else {
              console.log('WARNING: Type is not tag or text! @sub2Node')
              console.log(sub2Node.type, '-', sub2Node.name)
            }
          })
        } else {
          console.log('*********************************************')
          console.log('WARNING: No data or children found! @sub1Node')
          console.log(sub1Node.type, '-', sub1Node.name)
          console.log('*********************************************')
        }
      })
    }
  })
  text = text.filter(line => !(['(', ')', '[', ']', ',']).includes(line.replace(/ /g,'')))
  return text
}

function getChildrenText (children) {
  let text = []
  children.forEach(child => {
    if (child.type === 'text') {
      // const cleanText = child.data // .replace(/\)|\(/g,'')
      text.push(child.data)
      // console.log(child.data)
    } else if (child.type === 'tag') {
      if (child.name === 'a') {
        if (child.children.length) {
          child.children.forEach(grandChild => {
            if (grandChild.children.length) {
              grandChild.children.forEach(greatGrandChild => {
                if (greatGrandChild.data) {
                  // const cleanText = greatGrandChild.data // .replace(/\)|\(/g,'')
                  text.push(greatGrandChild.data)
                  // console.log(greatGrandChild.data)
                } else {
                  if (greatGrandChild.children.length) {
                    greatGrandChild.children.forEach(xChild => {
                      if (xChild.data) {
                        text.push(xChild.data)
                        // console.log(xChild.data)
                      }
                    })
                  }
                }
              })
            }
          })
        }
      } else if (child.name === 'i') {
        child.children.forEach(subChild => {
          if (subChild.data) {
            text.push(subChild.data)
            // console.log(subChild.data)
          }
        })
      }
    }
  })
  text = text.filter(line => !(['(', ')', '[', ']', ',']).includes(line.replace(/ /g,'')))
  return text
}

exports.handler = async (event) => {
  const songURL = event.body
  console.log(songURL)
  // if (songURL.includes('annotated')) {
  //   console.log('This one failed')
  //   return {
  //     statusCode: 200,
  //     headers: {
  //       "Content-Type": "application/json",
  //       "Access-Control-Allow-Origin": "*"
  //     },
  //     body: JSON.stringify({
  //       payload: ['Cant Find Lyrics :('],
  //       type: "fail"
  //     })
  //   };
  // }
  let lyrics = []
  await axios.get(songURL).then((response) => {
    const $ = cheerio.load(response.data)
    // console.log($("div[class^='Lyrics__Container']").text())
    lyric_objs = Object.values(($("div[class^='Lyrics__Container']").get()))
    lyric_objs.forEach(obj => {
      if (obj.children.length) {
        const bar = extractElementsText(obj.children)
        lyrics = lyrics.concat(bar)
      }
    })
  })

  // console.log(lyrics)

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
