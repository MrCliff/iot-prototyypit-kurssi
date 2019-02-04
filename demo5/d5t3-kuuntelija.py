#!/usr/bin/env python
# coding=utf-8
import redis
import time

TOPIC = 'random_data'

red = redis.StrictRedis(host='localhost', port=6379, db=0)


def message_handler(msg):
    print("Got message: %s" % msg['data'])


pub = red.pubsub(ignore_subscribe_messages=True)
pub.subscribe(**{TOPIC: message_handler})
thread = pub.run_in_thread(sleep_time=0.001)

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    thread.stop()
