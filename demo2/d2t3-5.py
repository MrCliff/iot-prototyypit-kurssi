#!/usr/bin/env python3
import RPi.GPIO as GPIO
import time

PIN_BTN = 26
PIN_PIR = 13
PIN_PEDESTRIAN_SIGNAL_LIGHT = 16

PIN_TL_PEDESTRIAN_GREEN = 20
PIN_TL_PEDESTRIAN_RED = 21

PIN_TL_VEHICLE_GREEN = 4
PIN_TL_VEHICLE_YELLOW = 5
PIN_TL_VEHICLE_RED = 6

PEDESTRIAN_LIGHT_GREEN_TIME = 5
CHECK_FOR_TRAFFIC_TIME = 5

VEHICLE_LIGHT_STATE_GREEN = "vg"
VEHICLE_LIGHT_STATE_YELLOW = "vy"
VEHICLE_LIGHT_STATE_YELLOW_RED = "vyr"
VEHICLE_LIGHT_STATE_RED = "vr"

PEDESTRIAN_LIGHT_STATE_GREEN = "pg"
PEDESTRIAN_LIGHT_STATE_RED = "pr"

GPIO.setmode(GPIO.BCM)
GPIO.setup(PIN_BTN, GPIO.IN)
GPIO.setup(PIN_PIR, GPIO.IN)
GPIO.setup(PIN_PEDESTRIAN_SIGNAL_LIGHT, GPIO.OUT)
GPIO.setup(PIN_TL_PEDESTRIAN_GREEN, GPIO.OUT)
GPIO.setup(PIN_TL_PEDESTRIAN_RED, GPIO.OUT)
GPIO.setup(PIN_TL_VEHICLE_GREEN, GPIO.OUT)
GPIO.setup(PIN_TL_VEHICLE_YELLOW, GPIO.OUT)
GPIO.setup(PIN_TL_VEHICLE_RED, GPIO.OUT)


def main():
    set_vehicle_light_state(VEHICLE_LIGHT_STATE_GREEN)
    set_pedestrian_light_state(PEDESTRIAN_LIGHT_STATE_RED)
    while True:
        if GPIO.input(PIN_BTN):
            set_pedestrian_signal_light_on(True)
            check_for_vehicle_traffic()
            set_traffic_light_state(PEDESTRIAN_LIGHT_STATE_GREEN)
            set_pedestrian_signal_light_on(False)

            time.sleep(PEDESTRIAN_LIGHT_GREEN_TIME)
            set_traffic_light_state(PEDESTRIAN_LIGHT_STATE_RED)

        time.sleep(0.1)


def check_for_vehicle_traffic():
    sleep_time = 0.1

    time_passed = 0
    while time_passed < CHECK_FOR_TRAFFIC_TIME:
        is_vehicle_traffic = GPIO.input(PIN_PIR)
        if not is_vehicle_traffic:
            return
        time.sleep(sleep_time)
        time_passed += sleep_time


def set_pedestrian_signal_light_on(is_on):
    GPIO.output(PIN_PEDESTRIAN_SIGNAL_LIGHT, is_on)


def set_traffic_light_state(pedestrian_light_state):
    if pedestrian_light_state == PEDESTRIAN_LIGHT_STATE_GREEN:
        set_vehicle_light_state(VEHICLE_LIGHT_STATE_YELLOW)
        time.sleep(1)
        set_vehicle_light_state(VEHICLE_LIGHT_STATE_RED)

        time.sleep(1)
        set_pedestrian_light_state(pedestrian_light_state)
    else:
        set_pedestrian_light_state(pedestrian_light_state)
        time.sleep(1)

        set_vehicle_light_state(VEHICLE_LIGHT_STATE_YELLOW_RED)
        time.sleep(1)
        set_vehicle_light_state(VEHICLE_LIGHT_STATE_GREEN)


def set_vehicle_light_state(state):
    if state == VEHICLE_LIGHT_STATE_GREEN:
        GPIO.output(PIN_TL_VEHICLE_GREEN, 1)
    else:
        GPIO.output(PIN_TL_VEHICLE_GREEN, 0)

    if state == VEHICLE_LIGHT_STATE_YELLOW or state == VEHICLE_LIGHT_STATE_YELLOW_RED:
        GPIO.output(PIN_TL_VEHICLE_YELLOW, 1)
    else:
        GPIO.output(PIN_TL_VEHICLE_YELLOW, 0)

    if state == VEHICLE_LIGHT_STATE_RED or state == VEHICLE_LIGHT_STATE_YELLOW_RED:
        GPIO.output(PIN_TL_VEHICLE_RED, 1)
    else:
        GPIO.output(PIN_TL_VEHICLE_RED, 0)


def set_pedestrian_light_state(state):
    # GPIO.output(PIN_TL_PEDESTRIAN_GREEN, is_green)
    # GPIO.output(PIN_TL_PEDESTRIAN_RED, not is_green)
    if state == PEDESTRIAN_LIGHT_STATE_GREEN:
        GPIO.output(PIN_TL_PEDESTRIAN_GREEN, 1)
    else:
        GPIO.output(PIN_TL_PEDESTRIAN_GREEN, 0)

    if state == PEDESTRIAN_LIGHT_STATE_RED:
        GPIO.output(PIN_TL_PEDESTRIAN_RED, 1)
    else:
        GPIO.output(PIN_TL_PEDESTRIAN_RED, 0)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        GPIO.cleanup()
