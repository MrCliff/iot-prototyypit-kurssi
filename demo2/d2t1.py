#!/usr/bin/env python3
import RPi.GPIO as GPIO
import time

PIN_LED = 4

GPIO.setmode(GPIO.BCM)
GPIO.setup(PIN_LED, GPIO.OUT)


def main():
    led_state = 0
    while True:
        led_state = 1 - led_state  # 0 -> 1 ; 1 -> 0
        GPIO.output(PIN_LED, led_state)

        time.sleep(1)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        GPIO.cleanup()
