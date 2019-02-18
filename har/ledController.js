const config = require('./config');
const Blynk = require('blynk-library');
const raspi = require('raspi');
const pwm = require('raspi-soft-pwm');

const GPIO_RED = 'GPIO4';
const GPIO_GREEN = 'GPIO5';
const GPIO_BLUE = 'GPIO6';

const MAX_PWM_VALUE = 255;
const MIN_PWM_VALUE = 0;
const PWM_FREQ = 100;

let blynk = new Blynk.Blynk(config.AUTH);

let v0 = new blynk.VirtualPin(0);

raspi.init(() => {
  const PIN_R = new pwm.SoftPWM({
    pin: GPIO_RED,
    frequency: PWM_FREQ
  });
  const PIN_G = new pwm.SoftPWM({
    pin: GPIO_GREEN,
    frequency: PWM_FREQ
  });
  const PIN_B = new pwm.SoftPWM({
    pin: GPIO_BLUE,
    frequency: PWM_FREQ
  });

  v0.on('write', (param) => {
    let r = intPWMToPercent(parseInt(param[0], 10));
    let g = intPWMToPercent(parseInt(param[1], 10));
    let b = intPWMToPercent(parseInt(param[2], 10));
    PIN_R.write(r);
    PIN_G.write(g);
    PIN_B.write(b);
  });
});


function intPWMToPercent(value, highEnd, lowEnd) {
  if (highEnd === undefined) highEnd = MAX_PWM_VALUE;
  if (lowEnd === undefined) lowEnd = MIN_PWM_VALUE;

  return Math.max(0, Math.min(1, (value - lowEnd) / (highEnd - lowEnd)));
}
