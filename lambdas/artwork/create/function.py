import os
import io
import json
import boto3
import requests
from urllib.parse import urlparse
from colorthief import ColorThief
from PIL import Image, ImageDraw, ImageFont, ImageOps

def handler(event, context):
  body = json.loads(event['body'])
  imageURL = body['imageURL']
  lyrics = body['lyrics']
  song = body['song']
  artist = body['artist']
  spUser = body['user']
  print(body)
  s3 = boto3.client('s3')
  imageID = imageURL.split('/')[-1]


  #Read image url as raw data and upload to S3
  response = requests.get(imageURL, stream=True)

  if response.status_code==200:
      url_parser = urlparse(imageURL)
      temp_file =  '/tmp/' + os.path.basename(url_parser.path)

  with open(temp_file, 'wb') as new_file:
      new_file.write(response.content)

  # raw_data = response.raw
  # s3.upload_fileobj(raw_data, 'images-barz-bot', '{}/{}.jpg'.format(spUser, imageID))


  # Scan image for color palette
  color_thief = ColorThief(temp_file)
  palette = color_thief.get_palette(color_count=5, quality=1)

  # Create frame for image
  frameImg = Image.new('RGB', (690, 690), color=palette[2])
  albumArtWorkImg = Image.new('RGB', (1000, 1000), color=palette[0])
  albumArtWorkImg.paste(frameImg, (155, 155))

  coverImg = Image.open(temp_file, 'r')
  albumArtWorkImg.paste(coverImg, (180,180))

  draw   = ImageDraw.Draw(albumArtWorkImg)
  r = requests.get('https://images-barz-bot.s3.us-east-2.amazonaws.com/DroidSansMono.ttf', allow_redirects=True)
  font = ImageFont.truetype(io.BytesIO(r.content), size=22)

  y = 850
  for line in lyrics:
    bar = line['text']
    width, height = font.getsize(bar)
    x = (1000-width)/2
    draw.text((x, y), bar, fill=palette[1], font=font, align='center')
    y += height


  temp_image_data = io.BytesIO()
  albumArtWorkImg.save(temp_image_data, format="JPEG")
  albumArtWorkImgData = temp_image_data.getvalue()

  s3.put_object(
    Bucket='images-barz-bot',
    Key='{}/{}.jpeg'.format(spUser, imageID),
    ContentType='image/jpeg',
    Body=albumArtWorkImgData
  )
  fileLink = 'https://images-barz-bot.s3.us-east-2.amazonaws.com/{}/{}.jpeg'.format(spUser, imageID)

  ########## Generate HTML Twitter Card (Social Share)
  twitterCardHTML = '<!DOCTYPE html><html>  <style>   img {     display: block;     margin-top: 10rem;  margin-left: auto;      margin-right: auto;   }   .center {     margin: 0;      position: absolute;     top: 65%;     left: 50%;      -ms-transform: translate(-50%, -50%);     transform: translate(-50%, -50%);   }   .barzbot-button {   background-color:#44c767;     border:1px solid #18ab29;     display:inline-block; cursor:pointer;     color:#ffffff;      font-family:Arial;      font-size:17px;padding:10px 24px;     text-decoration:none;     text-shadow:0px 1px 0px #2f6627;  }.barzbot-button:active {     position:relative;      top:1px;    }     </style>  <head>    <title>WEBPAGE-TITLE</title>    <meta charset=utf-8>    <meta name=description content="Created with @BarzBot!">    <meta name=format-detection content="telephone=no">   <meta name=msapplication-tap-highlight content=no>    <meta name=viewport content="user-scalable=no,initial-scale=1,maximum-scale=1,minimum-scale=1,width=device-width">    <meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@BarzBot">   <meta name="twitter:creator" content="@BarzBot">    <meta name="twitter:title" content="SONG-TITLE">    <meta name="twitter:description" content="SONG-LYRICS">   <meta name="twitter:image" content="IMAGE-LINK">  </head> <body style="background-color: #1d1d1d;">       <div class="verticalcenter">      <img style="width:20rem;" src="IMAGE-LINK"/>      </div>    <div class="center">      <a href="http://webapp-barz-bot.s3-website.us-east-2.amazonaws.com/#/" class="barzbot-button">Try BarzBot!</a>    </div>  </body></html>'
  filedata = twitterCardHTML.replace('WEBPAGE-TITLE', 'Created Using @BarzBot')
  filedata = filedata.replace('SONG-TITLE', '{} - {}'.format(song, artist))
  lyricsStr = ('\n').join([ line['text'] for line in lyrics ])
  filedata = filedata.replace('SONG-LYRICS', lyricsStr)
  filedata = filedata.replace('IMAGE-LINK', fileLink)
  print('JPEG', 'https://images-barz-bot.s3.us-east-2.amazonaws.com/{}/{}.jpeg'.format(spUser, imageID))
  print('HTML', 'https://images-barz-bot.s3.us-east-2.amazonaws.com/{}/{}.html'.format(spUser, imageID))

  s3.put_object(
    Bucket='images-barz-bot',
    Key='{}/{}.html'.format(spUser, imageID),
    ContentType='text/html',
    Body=filedata
  )

  return {
    'statusCode': 200,
    'headers': {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    "body": json.dumps( {
      "type": "success",
      "payload": fileLink
    })
  }