import os
import io
import json
import boto3
import requests
from urllib.parse import urlparse
from urllib.request import urlopen
from colorthief import ColorThief
from PIL import Image, ImageDraw, ImageFont, ImageOps

def handler(event, context):
  body = json.loads(event['body'])
  imageURL = body['imageURL']
  lyrics = body['lyrics']
  spUser = body['user']

  s3 = boto3.client('s3')
  imageID = imageURL.split('/')[-1]

  #Download image and Upload to S3 bucket
  response = requests.get(imageURL)
  if response.status_code==200:
      raw_data = response.content
      url_parser = urlparse(imageURL)
      temp_file =  '/tmp/' + os.path.basename(url_parser.path)

  with open(temp_file, 'wb') as new_file:
      new_file.write(raw_data)

  # Open the server file as read mode and upload in AWS S3 Bucket.
  data = open(temp_file, 'rb')
  s3.put_object(Bucket='barz-bot-images', Key='{}/{}.jpg'.format(spUser, imageID), Body=data)
  data.close()

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
  r = requests.get('https://barz-bot-images.s3.us-east-2.amazonaws.com/Droid+Sans+Mono.ttf', allow_redirects=True)
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
  s3.put_object(Bucket='barz-bot-images', Key='{}/{}.jpg'.format(spUser, imageID), Body=temp_image_data.getvalue())
  fileLink = 'https://barz-bot-images.s3.us-east-2.amazonaws.com/{}/{}.jpg'.format(spUser, imageID)
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
