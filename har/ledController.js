const config = require('./config');
const Blynk = require('blynk-library');
const raspi = require('raspi');
const pwm = require('raspi-soft-pwm');
const Table = require('./table');
const colors = require('./colors');

const GPIO_RED = 'GPIO4';
const GPIO_GREEN = 'GPIO5';
const GPIO_BLUE = 'GPIO6';

// const MAX_PWM_VALUE = 255;
// const MIN_PWM_VALUE = 0;
const PWM_FREQ = 100;

let blynk = new Blynk.Blynk(config.AUTH);

let vWidgetTable = new blynk.WidgetTable(0);
let vPinHue = new blynk.VirtualPin(1);
let vPinSaturation = new blynk.VirtualPin(2);
let vPinValue = new blynk.VirtualPin(3);
let vPinAddColor = new blynk.VirtualPin(4);
let vPinRemoveColor = new blynk.VirtualPin(5);

let table = null;


const DEBUG = true;

function debug(message, ...optionalParams) {
  if (DEBUG) {
    console.log("DEBUG: " + message, ...optionalParams);
  }
}


blynk.on('connect', () => {
  table = new Table(blynk, vWidgetTable, vPinHue, vPinSaturation, vPinValue);
});

// GPIO pin initialization.
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

  // v0.on('write', (param) => {
  //   let r = intPWMToPercent(parseInt(param[0], 10));
  //   let g = intPWMToPercent(parseInt(param[1], 10));
  //   let b = intPWMToPercent(parseInt(param[2], 10));
  //   PIN_R.write(r);
  //   PIN_G.write(g);
  //   PIN_B.write(b);
  // });

  vPinHue.on('write', (param) => {
    table.setCurrentH(parseInt(param, 10));
    updateColor();
  });
  vPinSaturation.on('write', (param) => {
    table.setCurrentS(parseFloat(param));
    updateColor();
  });
  vPinValue.on('write', (param) => {
    table.setCurrentV(parseFloat(param));
    updateColor();
  });

  vPinAddColor.on('write', (param) => {
    let value = parseInt(param, 10);
    if (value === 1) {
      debug("Add color pressed");

      table.addRow();
    }
  });
  vPinRemoveColor.on('write', (param) => {
    let value = parseInt(param, 10);
    if (value === 1) {
      debug("Remove color pressed");

      table.removeSelectedRows();
    }
  });

  /**
   * Updates the states of the GPIO pins to correspond to the current color.
   */
  function updateColor() {
    let hsv = table.getCurrentHsv();
    let rgb = colors.hsvToRgb(hsv.h, hsv.s, hsv.v);

    PIN_R.write(rgb.r);
    PIN_G.write(rgb.g);
    PIN_B.write(rgb.b);
  }
});


// ------------------------------------
// Helper functions
// ------------------------------------


// function intPWMToPercent(value, highEnd, lowEnd) {
//   if (highEnd === undefined) highEnd = MAX_PWM_VALUE;
//   if (lowEnd === undefined) lowEnd = MIN_PWM_VALUE;
//
//   return Math.max(0, Math.min(1, (value - lowEnd) / (highEnd - lowEnd)));
// }
