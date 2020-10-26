import os
import io
import boto3
import requests
from urllib.parse import urlparse
from colorthief import ColorThief
from PIL import Image, ImageDraw, ImageFont, ImageOps

def handler(event, context):
  s3 = boto3.client('s3')

  url = "https://i.scdn.co/image/ab67616d0000b2733907a711fe2eaf9f50585572"
  imageID = url.split('/')[-1]

  #Download image and Upload to S3 bucket
  response = requests.get(url)
  if response.status_code==200:
      raw_data = response.content
      url_parser = urlparse(url)
      file_name =  '/tmp/' + os.path.basename(url_parser.path)

  with open(file_name, 'wb') as new_file:
      new_file.write(raw_data)

  # Open the server file as read mode and upload in AWS S3 Bucket.
  data = open(file_name, 'rb')
  s3.put_object(Bucket='barz-bot-images', Key='{}.jpg'.format(imageID), Body=data)
  data.close()

  # Scan image for color palette
  color_thief = ColorThief(file_name)
  palette = color_thief.get_palette(color_count=5, quality=1)
  print(palette)

  # Create frame for image
  frameImg = Image.new('RGB', (690, 690), color=palette[2])
  albumArtWorkImg = Image.new('RGB', (1000, 1000), color=palette[0])
  albumArtWorkImg.paste(frameImg, (155, 155))

  coverImg = Image.open(file_name, 'r')
  albumArtWorkImg.paste(coverImg, (180,180))

  in_mem_file = io.BytesIO()
  albumArtWorkImg.save(in_mem_file, format="JPEG")
  s3.put_object(Bucket='barz-bot-images', Key='{}.jpg'.format(imageID), Body=in_mem_file.getvalue())

  return {}
