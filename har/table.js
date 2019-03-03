const colors = require('./colors');

const DEBUG = true;

function debug(message, ...optionalParams) {
    if (DEBUG) {
        console.log("DEBUG: " + message, ...optionalParams);
    }
}

/**
 * An object that holds and modifies the state of the Blynk table widget. This
 * also modifies the state of the three sliders used for HSV color selector.
 */
let Table = function(blynk, vPinWidgetTable, vPinHue, vPinSat, vPinVal) {
    this.table = vPinWidgetTable;
    this.vPin = new blynk.VirtualPin(this.table.pin);

    // TODO: Decouple these hue sliders into another object.
    this.vPinHue = vPinHue;
    this.vPinSaturation = vPinSat;
    this.vPinValue = vPinVal;

    this.nextId = 1;

    this.state = {
        currentRowId: 0,
        table: [{
            id: 0,
            hsv: {h: 0, s: 1, v: 1}
        }],
        selectedRowIds: new Set([0])
    };

    this.vPin.on('write', (param) => {
        let cmd = param[0].toString();

        switch (cmd) {
            case "select":
                let rowIdSel = parseInt(param[1], 10);
                this.selectRow(rowIdSel);

                debug("Row selected: " + rowIdSel);
                break;
            case "deselect":
                let rowIdDesel = parseInt(param[1], 10);
                this.deselectRow(rowIdDesel);

                debug("Row deselected: " + rowIdDesel);
                break;
            case "order":
                let oldRowIndex = parseInt(param[1], 10);
                let newRowIndex = parseInt(param[2], 10);
                this.changeRowOrder(oldRowIndex, newRowIndex);

                debug("Row order changed. oldIndex: " + oldRowIndex + ", newIndex: " + newRowIndex);
                break;
        }
    });

    /**
     * Adds the given row to the selected rows.
     *
     * @param rowId the id of the row to add.
     */
    this.selectRow = (rowId) => {
        this.state.selectedRowIds.add(rowId);
        this.updateCurrentRow();
    };

    /**
     * Removes the given row from the selected rows.
     *
     * @param rowId the id of the row to remove.
     */
    this.deselectRow = (rowId) => {
        this.state.selectedRowIds.delete(rowId);
        this.updateCurrentRow();
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

        this.updateCurrentRow();

        debug(JSON.stringify(this.state));
    };

    /**
     * Updates the current row. The new current row will be the first row on the
     * table that is selected or was selected just before this update. If lastly
     * selected row is removed, the first row on the table will be set as the
     * current row.
     */
    this.updateCurrentRow = () => {
        let rowIdUpdated = false;
        for (let i = 0; i < this.state.table.length; i++) {
            let item = this.state.table[i];
            if (this.state.selectedRowIds.has(item.id)) {
                this.state.currentRowId = item.id;

                rowIdUpdated = true;
                break;
            }
        }

        if (!rowIdUpdated && !this.state.table.find(item => item.id === this.state.currentRowId)) {
            this.state.currentRowId = this.state.table[0].id;
        }

        let hsv = this.getCurrentHsv();
        this.vPinHue.write(hsv.h);
        this.vPinSaturation.write(hsv.s);
        this.vPinValue.write(hsv.v);
        this.setSliderColors(hsv);

        this.table.highlight_row(this.state.currentRowId);
        this.updateRowToTableWidget(this.state.currentRowId, hsv);

        debug("HSV values written: " + JSON.stringify(this.getCurrentHsv()));
    };

    /**
     * Sets the colors of the Blynk sliders.
     *
     * @param hsv the HSV to which to set the colors.
     */
    this.setSliderColors = (hsv) => {
        let hueColor = colors.hsvToRgb(hsv.h, 1, 1);
        let satColor = colors.hsvToRgb(hsv.h, hsv.s, 1);
        // vPinHue.write("color", rgbToHexString(rgb.r, rgb.g, rgb.b));
        // let hueColor = rgbToHexString(rgb.r, rgb.g, rgb.b);
        // debug(hueColor);
        blynk.setProperty(this.vPinHue.pin, "color", colors.rgbToHexString(hueColor.r, hueColor.g, hueColor.b));
        blynk.setProperty(this.vPinSaturation.pin, "color", colors.rgbToHexString(satColor.r, satColor.g, satColor.b));
        blynk.setProperty(this.vPinValue.pin, "color", colors.rgbToHexString(hsv.v, hsv.v, hsv.v));
    };

    /**
     * Returns the currently selected HSV.
     *
     * NOTE: Don't set the hsv values using this. Use the setters instead.
     *
     * @returns {hsv|{h, s, v}} The HSV to return.
     */
    this.getCurrentHsv = () => {
        debug("getCurrentHsv: ", this.state);
        return this.state.table.find(item => item.id === this.state.currentRowId).hsv;
    };

    /**
     * Sets the current HSV Hue.
     *
     * @param value the new value.
     */
    this.setCurrentH = (value) => {
        let hsv = this.getCurrentHsv();
        hsv.h = value;

        this.updateCurrentRow();
    };

    /**
     * Sets the current HSV Saturation.
     *
     * @param value the new value.
     */
    this.setCurrentS = (value) => {
        let hsv = this.getCurrentHsv();
        hsv.s = value;

        this.updateCurrentRow();
    };

    /**
     * Sets the current HSV Value.
     *
     * @param value the new value.
     */
    this.setCurrentV = (value) => {
        let hsv = this.getCurrentHsv();
        hsv.v = value;

        this.updateCurrentRow();
    };

    /**
     * Clears the table to its initial state (not currently in use).
     */
    this.clear = () => {
        this.state.selectedRowIds.clear();
        this.state.table.splice(0, this.state.table.length);
        this.table.clear();

        debug("Table cleared");

        this.addRow();
    };

    /**
     * Returns a unique id.
     *
     * @returns {number} a unique id.
     */
    this.getNextId = () => {
        return this.nextId++;
    };

    /**
     * Adds a new HSV to the table.
     */
    this.addRow = () => {
        let newRow = {
            id: this.getNextId(),
            hsv: {h: 0, s: 1, v: 1}
        };
        this.state.table.push(newRow);

        let hsv = newRow.hsv;
        this.addRowToTableWidget(newRow.id, hsv);
        this.table.select_row(newRow.id);
        this.state.selectedRowIds.add(newRow.id);

        this.updateCurrentRow();

        debug(JSON.stringify(this.state));
    };

    /**
     * Removes the rows that are currently selected.
     */
    this.removeSelectedRows = () => {
        let indexesOfRowsToRemove = Array.from(this.state.selectedRowIds)
            .map(rowId => this.state.table.findIndex(item => item.id === rowId));
        indexesOfRowsToRemove.sort((a, b) => b - a); // Sort into reverse order
        debug("Remove rows at indexes: " + indexesOfRowsToRemove.join(", "));

        if (indexesOfRowsToRemove.length === 0) {
            return;
        }

        indexesOfRowsToRemove.forEach(rowIndex => {
            this.state.table.splice(rowIndex, 1);
        });

        this.state.selectedRowIds.clear();

        this.table.clear();
        this.state.table.forEach((row) => {
            let hsv = row.hsv;
            this.addRowToTableWidget(row.id, hsv);
            this.table.deselect_row(row.id);
        });

        if (this.state.table.length === 0) {
            this.addRow();
        }

        this.updateCurrentRow();

        debug("Selected rows removed");
    };

    /**
     * Returns a color string representing the given HSV color.
     *
     * @param hsv the HSV color values.
     * @returns {string} a string representing the given HSV color.
     */
    this.getHsvColorString = (hsv) => {
        return "h: " + hsv.h + ", s: " + hsv.s + ", v: " + hsv.v;
    };

    /**
     * Adds a row to the table widget on Blynk.
     *
     * @param id the id of the row to add.
     * @param hsv the HSV color value to add.
     */
    this.addRowToTableWidget = (id, hsv) => {
        this.table.add_row(id, "", this.getHsvColorString(hsv));
    };

    /**
     * Updates a row on the table widget on Blynk.
     *
     * @param id the id of the row to update.
     * @param hsv the new HSV color value to update to.
     */
    this.updateRowToTableWidget = (id, hsv) => {
        this.table.update_row(id, "", this.getHsvColorString(hsv));
    };

    this.clear();
};


module.exports = Table;
