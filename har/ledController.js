const config = require('./config');
const Blynk = require('blynk-library');
const raspi = require('raspi');
const pwm = require('raspi-soft-pwm');

const GPIO_RED = 'GPIO4';
const GPIO_GREEN = 'GPIO5';
const GPIO_BLUE = 'GPIO6';

// const MAX_PWM_VALUE = 255;
// const MIN_PWM_VALUE = 0;
const PWM_FREQ = 100;

let blynk = new Blynk.Blynk(config.AUTH);

let table = new blynk.WidgetTable(0);
let vPinHue = new blynk.VirtualPin(1);
let vPinSaturation = new blynk.VirtualPin(2);
let vPinValue = new blynk.VirtualPin(3);
let vPinAddColor = new blynk.VirtualPin(4);
let vPinRemoveColor = new blynk.VirtualPin(5);

/**
 * An object that holds and modifies the state of the table.
 */
let TableState = function(table, vPinHue, vPinSat, vPinVal) {
  this.table = table;
  this.vPin = new blynk.VirtualPin(this.table.pin);
  this.vPinHue = vPinHue;
  this.vPinSaturation = vPinSat;
  this.vPinValue = vPinVal;

  this.state = {
    currentHsv: 0,
    table: [{
        // id: 0,
        hsv: {h: 0, s: 1, v: 1}
    }],
    selectedRows: new Set([0])
  };

  this.vPin.on('write', (param) => {
    let cmd = param[0].toString();

    switch (cmd) {
      case "select":
        let rowIdSel = parseInt(param[1], 10);
        this.selectRow(rowIdSel);
        break;
      case "deselect":
        let rowIdDesel = parseInt(param[1], 10);
        this.deselectRow(rowIdDesel);
        break;
      case "order":
        let oldRowId = parseInt(param[1], 10);
        let newRowId = parseInt(param[2], 10);
        this.changeRowOrder(oldRowId, newRowId);
        break;
    }
  });

  /**
   * Adds the given row to the selected rows.
   *
   * @param rowId the id of the row to add.
   */
  this.selectRow = (rowId) => {
    this.state.selectedRows.add(rowId);
    this.updateCurrentHsv();
  };

  /**
   * Removes the given row from the selected rows.
   *
   * @param rowId the id of the row to remove.
   */
  this.deselectRow = (rowId) => {
    this.state.selectedRows.delete(rowId);
    this.updateCurrentHsv();
  };

  /**
   * Moves the row at the oldRowIndex to the newRowIndex.
   *
   * @param oldRowIndex the index from which to move.
   * @param newRowIndex the destination index.
   */
  this.changeRowOrder = (oldRowIndex, newRowIndex) => {
    let row = this.state.table[oldRowIndex];
    this.state.table.splice(newRowIndex, 0, row);
    if (oldRowIndex < newRowIndex) { // Remove the old row.
      this.state.table.splice(oldRowIndex, 1);
    }
    else {
      this.state.table.splice(oldRowIndex + 1, 1);
    }

    this.updateCurrentHsv();
  };

  /**
   * Updates the current hsv.
   */
  this.updateCurrentHsv = () => {
    this.state.table.forEach((item, index) => {
      if (this.state.selectedRows.has(index)) {
        this.state.currentHsv = index;

        this.vPinHue.write(this.getCurrentHsv().h);
        this.vPinSaturation.write(this.getCurrentHsv().s);
        this.vPinValue.write(this.getCurrentHsv().v);

        return;
      }
    });
  };

  /**
   * Returns the currently selected HSV.
   *
   * @returns {hsv|{s, v, h}} The HSV to return.
   */
  this.getCurrentHsv = () => {
    return this.state.table[this.state.currentHsv].hsv;
  };

  /**
   * Clears the table to its initial state (not currently in use).
   */
  this.clear = () => {
    this.state.selectedRows.clear();
    this.state.table.splice(0, this.state.table.length);
    this.table.clear();

    this.addRow();
  };

  /**
   * Adds a new HSV to the table.
   */
  this.addRow = () => {
    let newRow = {
      hsv: {h: 0, s: 1, v: 1}
    };
    this.state.table.splice(0, 0, newRow);
    let index = 0;

    let hsv = newRow.hsv;
    let name = "h: " + hsv.h + ", s: " + hsv.s + ", v: " + hsv.v;
    console.log(name);
    console.log(JSON.stringify(this.state));
    this.table.add_row(index, name, "");
  };

  /**
   * Removes the rows that are currently selected.
   */
  this.removeSelectedRows = () => {
    let rowsToRemove = Array.from(this.state.selectedRows);
    rowsToRemove.sort((a, b) => b - a); // Sort into reverse order
    rowsToRemove.forEach(rowInd => {
      this.state.table.splice(rowInd, 1);
    });

    this.state.selectedRows.clear();

    this.table.clear();
    this.state.table.forEach((row, index) => {
      let hsv = row.hsv;
      this.table.add_row(index, "h: " + hsv.h + ", s: " + hsv.s + ", v: " + hsv.v, "");
    });
  };

  this.clear();
};

let state = new TableState(table, vPinHue, vPinSaturation, vPinValue);

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
    state.getCurrentHsv().h = parseInt(param, 10);
    updateColor();
  });
  vPinSaturation.on('write', (param) => {
    state.getCurrentHsv().s = parseFloat(param);
    updateColor();
  });
  vPinValue.on('write', (param) => {
    state.getCurrentHsv().v = parseFloat(param);
    updateColor();
  });

  vPinAddColor.on('write', (param) => {
    let value = parseInt(param, 10);
    if (value === 1) {
      state.addRow();
    }
  });
  vPinRemoveColor.on('write', (param) => {
    let value = parseInt(param, 10);
    if (value === 1) {
      state.removeSelectedRows();
    }
  });

  function updateColor() {
    let hsv = state.getCurrentHsv();
    let rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);

    PIN_R.write(rgb.r);
    PIN_G.write(rgb.g);
    PIN_B.write(rgb.b);

    let hueColor = hsvToRgb(hsv.h, 1, 1);
    let satColor = hsvToRgb(hsv.h, hsv.s, 1);
    // vPinHue.write("color", rgbToHexString(rgb.r, rgb.g, rgb.b));
    // let hueColor = rgbToHexString(rgb.r, rgb.g, rgb.b);
    // console.log(hueColor);
    blynk.setProperty(vPinHue.pin, "color", rgbToHexString(hueColor.r, hueColor.g, hueColor.b));
    blynk.setProperty(vPinSaturation.pin, "color", rgbToHexString(satColor.r, satColor.g, satColor.b));
    blynk.setProperty(vPinValue.pin, "color", rgbToHexString(hsv.v, hsv.v, hsv.v));
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


/**
 * Converts the given HSV color into RGB format.
 * https://en.wikipedia.org/wiki/HSL_and_HSV#Alternative_HSV_conversion
 *
 * @param hue the hue component of HSV color. Must be in range [0, 360].
 * @param saturation the saturation component of HSV color. Must be in range
 *        [0, 1].
 * @param value the value component of HSV color. Must be in range [0, 1].
 * @returns {{r: *, b: *, g: *}} the RGB color as JS object. Contains the r, g
 *          and b components in fields named r, g and b respectively. The
 *          values are in range [0, 1].
 */
function hsvToRgb(hue, saturation, value) {
  function f(n) {
    let k = (n + hue / 60) % 6;
    return value - value * saturation * Math.max(Math.min(k, 4 - k, 1), 0);
  }

  return {
    r: f(5),
    g: f(3),
    b: f(1)
  };
}

/**
 * Converts the given RGB color into 24 bit hexadecimal string.
 *
 * @param red the red component of the color. In range [0, 1].
 * @param green the green component of the color. In range [0, 1].
 * @param blue the blue component of the color. In range [0, 1].
 * @returns {string} a hexadecimal string representation of the given RGB
 *                   color. (Like #a53f82).
 */
function rgbToHexString(red, green, blue) {
  // Convert [0, 1]: float -> [0, 255]: int
  let r = Math.floor(0xFF * red);
  let g = Math.floor(0xFF * green);
  let b = Math.floor(0xFF * blue);

  let rBits = (r & 0xFF) << 16 ;
  let gBits = (g & 0xFF) << 8;
  let bBits = b & 0xFF;
  let hex = rBits | gBits | bBits;
  return "#" + hex.toString(16).padStart(6, "0").toUpperCase();
}
