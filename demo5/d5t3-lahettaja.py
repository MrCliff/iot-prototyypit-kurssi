#!/usr/bin/env python
# coding=utf-8
import redis
import random as rand
import time

TOPIC = 'random_data'

red = redis.StrictRedis(host='localhost', port=6379, db=0)

try:
    while True:
        red.publish(TOPIC, rand.randint(0, 100))

        time.sleep(rand.random() * 2)
except KeyboardInterrupt:
    pass
