#!/usr/bin/env python3
import RPi.GPIO as GPIO
import time

PIN_LED = 4
PIN_BTN = 5
PIN_PIR = 6

GPIO.setmode(GPIO.BCM)
GPIO.setup(PIN_LED, GPIO.OUT)
GPIO.setup(PIN_BTN, GPIO.IN)
GPIO.setup(PIN_PIR, GPIO.IN)


def main():
    last_pir_state = 0
    while True:
        led_state = GPIO.input(PIN_BTN)
        GPIO.output(PIN_LED, led_state)

        pir_state = GPIO.input(PIN_PIR)
        if pir_state != last_pir_state:
            print('Liiketunnistimen tila: %d' % pir_state)
            last_pir_state = pir_state

        time.sleep(0.1)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        GPIO.cleanup()
