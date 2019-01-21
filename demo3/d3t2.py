#!/usr/bin/env python
# coding=utf-8
import time
import datetime

import Adafruit_DHT
import gspread
from oauth2client.service_account import ServiceAccountCredentials

sensor = Adafruit_DHT.DHT11
DHT_PIN = 4

GDOCS_OAUTH_JSON = '../local/TIEA345-Lampotilasensori-70f66588eb99.json'
GDOCS_SPREADSHEET_NAME = 'Sensoridataa - TIEA345 - Joonatan Kallio'

FREQUENCY_SECONDS = 30

worksheet = None
while True:
    if worksheet is None:
        scope = ['https://spreadsheets.google.com/feeds',
                 'https://www.googleapis.com/auth/drive']
        credentials = ServiceAccountCredentials.from_json_keyfile_name(GDOCS_OAUTH_JSON, scope)
        gc = gspread.authorize(credentials)
        worksheet = gc.open(GDOCS_SPREADSHEET_NAME).sheet1

    humidity, temperature = Adafruit_DHT.read_retry(sensor, DHT_PIN)
    if humidity is None or temperature is None:
        time.sleep(2)
        continue

    print('Temp={0:0.1f}*C  Humidity={1:0.1f}%'.format(temperature, humidity))

    try:
        worksheet.append_row((str(datetime.datetime.now()), temperature, humidity))
    except gspread.exceptions.GSpreadException:
        # Error appending data, most likely because credentials are stale.
        # Null out the worksheet so a login is performed at the top of the loop.
        print('Append error, logging in again')
        worksheet = None
        time.sleep(FREQUENCY_SECONDS)
        continue

    print('Wrote a row to {0}'.format(GDOCS_SPREADSHEET_NAME))
    time.sleep(FREQUENCY_SECONDS)
