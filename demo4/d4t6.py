#!/usr/bin/env python
# coding=utf-8
import cv2
from matplotlib import pyplot as plt

img1 = cv2.imread('RasPi2.jpg', 0)
img2 = cv2.imread('RasPi3.jpg', 0)

orb = cv2.ORB_create()
keypoints1 = orb.detect(img1, None)
keypoints1, description1 = orb.compute(img1, keypoints1)

imgOut1 = cv2.drawKeypoints(img1, keypoints1, None, (255, 0, 0), 4)
plt.imshow(cv2.cvtColor(imgOut1, cv2.COLOR_BGR2RGB)), plt.savefig('out1.png')

keypoints2 = orb.detect(img2, None)
keypoints2, description2 = orb.compute(img2, keypoints2)

imgOut2 = cv2.drawKeypoints(img2, keypoints2, None, (255, 0, 0), 4)
plt.imshow(cv2.cvtColor(imgOut2, cv2.COLOR_BGR2RGB)), plt.savefig('out2.png')

bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
matches = bf.match(description1, description2)

imgMat = cv2.drawMatches(img1, keypoints1, img2, keypoints2, matches, None, flags=2)
plt.imsave('matches.png', imgMat)
