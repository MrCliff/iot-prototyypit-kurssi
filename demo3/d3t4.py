#!/usr/bin/env python
# coding=utf-8
from picamera import PiCamera
import RPi.GPIO as GPIO
import time
from datetime import datetime

PIN_PIR = 5

GPIO.setmode(GPIO.BCM)
GPIO.setup(PIN_PIR, GPIO.IN)

camera = PiCamera()


def main():
    while True:
        if GPIO.input(PIN_PIR):
            file_path = '/home/pi/projects/iot-prototyypit-kurssi/local/kuva-%s.jpg'\
                        % datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
            camera.capture(file_path)
            print("Took picture into file: %s" % file_path)
        time.sleep(2)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        GPIO.cleanup()
