// Xword, interactive Crossword app
// Author: John Lynch
// Date: May 2021
// File: xword/scripts/index.js

// First, handle display of "About" data in a fixed modal overlay
const aboutBox = document.getElementById(`about-box`);
const aboutHideButton = document.getElementById(`hide-about`);
const aboutLink = document.getElementById(`about`);
const aboutButton = document.getElementById(`show-about`);
[aboutLink, aboutButton].forEach(aboutTrigger => {
    aboutTrigger.addEventListener(`click`, _ => {
        aboutBox.style.display = `block`;
        aboutBox.scrollTop = 0;
    });
});
aboutHideButton.addEventListener(`click`, _ => {
    aboutBox.style.display = `none`;
});

// Now follows code for the main app.

// get a random integer in range [0, n]
let randInt = n => Math.floor(n * Math.random());

const BLACK = `#000000`;
const WHITE = `#ffffff`;
const NULL_STR = ``;
const NBSP = `\xa0`;
const NEWLINE = `\n`;
const SEMICOLON = `;`;

const [W, H] = [15, 15];


const contrastInfo = document.getElementById(`contrast-info`);
const col0Box = document.getElementById(`contrast-col0`);
const col1Box = document.getElementById(`contrast-col1`);
const contrastDetails = document.getElementById(`contrast-details`);

function displayContrastInfo() {
    dragBar.innerText = `Contrast Info`;
    const col0 = palette[selectedColours[0]].style.backgroundColor;
    const col1 = palette[selectedColours[1]].style.backgroundColor;
    col0Box.style.backgroundColor = col0;
    col1Box.style.backgroundColor = col1;
    col0Box.style.color = getLuminance(col0) > 0.3 ? BLACK : WHITE;
    col1Box.style.color = getLuminance(col1) > 0.3 ? BLACK : WHITE;
    col0Box.innerText = rgb2Hex(col0);
    col1Box.innerText = rgb2Hex(col1);
    contrastDetails.innerText = `Contrast ratio = ${contrastRatio(col0, col1).toFixed(2)}`;
    modal.replaceChild(contrastInfo, modal.lastElementChild);
    modal.style.display = `block`;
    if (modalPosition.length == 0) {
        modal.style.left = `calc(50% - ${modal.clientWidth / 2}px)`;
        modal.style.top = `calc(50% - ${modal.clientHeight / 2}px)`;
    }
    else {
        [modal.style.left, modal.style.top] = modalPosition; 
    }
}



// Modal dialog - let user dismiss it by clicking in the body
// but not on buttons obviously; should be intuitive.
const codeBlock = document.getElementById(`code-block`);
const modal = document.getElementById(`modal`);
document.addEventListener('click', ev => {
    if (modal.style.display = `block` 
        && !Array.from(modal.querySelectorAll("*")).includes(ev.target)
        && ev.target != modal
        && !Array.from(document.getElementById(`controls`).querySelectorAll("*")).includes(ev.target)) {
            modalPosition = [modal.style.left, modal.style.top];
            modal.style.display = `none`;
    }
});

// The following code to make the modal draggable adapted frpm
// https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_draggable
const dragBar = document.getElementById(`modal-drag-bar`);
dragModal();   // make modal draggable 

function dragModal() {
    let [x0, y0, x1, y1] = [0, 0, 0, 0];
    dragBar.onmousedown = dragMouseDown; 

    function dragMouseDown(ev) {
        ev = ev || window.event;
        ev.preventDefault();
        // get the mouse cursor position at startup:
        x1 = ev.clientX;
        y1 = ev.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(ev) {
        ev = ev || window.event;
        ev.preventDefault();
        // calculate the new cursor position:
        x0 = x1 - ev.clientX;
        y0 = y1 - ev.clientY;
        x1 = ev.clientX;
        y1 = ev.clientY;
        // set the element's new position:
        modalPosition = [(modal.offsetLeft - x0) + "px", (modal.offsetTop - y0) + "px"];
        [modal.style.left, modal.style.top] = modalPosition;
    }

    function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Code to populate code block display of palette as 
// CSS vars and an array of hex colours as strings.
const varSlots = codeBlock.getElementsByClassName(`code-list-item`);
const varArray = document.getElementById(`code-item`);


// ==========================================================================

// Grid of coloured squares
const colourGrid = document.getElementById("colour-grid");

initCells((i, j) => (i + j) % 2 ? '#fff' : '#000');

let cells = Array.from(colourGrid.children);
cells.forEach(cell => {
    cell.addEventListener('click', handleClickOnCell);
    cell.classList.add('cell');
    let span = document.createElement(`SPAN`);  // default opacity 0 for hex colours
    span.style.lineHeight = window.getComputedStyle(cell).height;   // centre it on y axis
    span.classList.add(`hex-colour`)
    cell.appendChild(span);
});

// =================================================================================================

// Status indicator
const status = document.getElementById("status");

// Listener for 'Show Hex' button
document.getElementById("show-hex").addEventListener('click', function() {
    showHex = !showHex;
    this.innerText = showHex ? "HIDE HEX" : "SHOW HEX";
    for (let paletteSlot of palette) {
        let colour = paletteSlot.style.backgroundColor;
        let lum = getLuminance(colour);
        paletteSlot.innerText = paletteSlot.isActive  && showLum ? `${lum.toFixed(2)}` : NBSP;    // == &nbsp;
        let conj = showHex && showLum ? ` / ` : NBSP;
        paletteSlot.innerText = paletteSlot.isActive ?
            `${showHex ? rgb2Hex(colour) : NULL_STR}${conj}${showLum ? lum.toFixed(2) : NULL_STR}` : NBSP;
    }
    generate();
});

// =================================================================================================

function reset() {
    activeSliders.clear();
    setSliderOpacity();
    setSwitches();
    generate();
}

function handleClickOnCell() {
    appendPalette(this.style.backgroundColor);
}

function initCells(setCellColour) {
    for (let j = 0; j < H; j++) {
        for (let i = 0; i < W; i++) {
            let cell = document.createElement("div");
            cell.x = i;
            cell.y = j;
            // Set some initial colours for the cells... 
            cell.style.backgroundColor =  setCellColour(i, j);
            colourGrid.appendChild(cell);
        }   
    }
}

// We only want the two most recent, or one if user changed between RGB and HSL groups.
function setSwitches() {
    for (let i = 0; i < 6; i++) {
        let sliderIsActive = activeSliders.has(i);
        onSwitches[i].checked = sliderIsActive;
        offSwitches[i].checked = !sliderIsActive;
        switchboxes[i].style.opacity = activeSliders.group == Math.trunc(i / 3) ? 1 : 0.3;
    }     
}

// As above, we only want the two most recent, or one if user changed between RGB and HSL groups.
function setSliderOpacity() {
    for (let i = 0; i < 6; i++) {
        sliderWrappers[i].style.opacity = activeSliders.has(i) ? 1 : 0.3;
    }
}

// Main function to generate a new colour block and render it.
function generate() {
    switch (activeSliders.group) {
        case -1:    // If no sliders fixed, generate a grid of random colours
            setStatus(`Random ${randomMode.toUpperCase()}`);
            cells.forEach(cell => {
                cell.style.backgroundColor = randomMode == `hsl` ?
                    `hsl(${randInt(360)}, ${randInt(101)}%, ${randInt(101)}%)`
                    : `rgb(${randInt(256)}, ${randInt(256)}, ${randInt(256)})`;
            });
            break;
        case 0:     // Handle RGB cases
            switch (activeSliders.activeCount) {
                case 1: 
                    setStatus(`${names[activeSliders.first]}:  ${values[activeSliders.first]}`);
                    cells.forEach(cell => {
                        let rgb = activeSliders.has(0) ? [values[0], rgbFactor * cell.x, rgbFactor * cell.y]
                            : (activeSliders.has(1) ? [rgbFactor * cell.x, values[1], rgbFactor * cell.y]
                            : [rgbFactor * cell.x, rgbFactor * cell.y, values[2]]);
                        cell.style.backgroundColor = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
                    });
                    break;
                case 2:
                    setStatus(`${names[activeSliders.first]}:  ${values[activeSliders.first]}, ${names[activeSliders.second]}:  ${values[activeSliders.second]}`);
                    cells.forEach(cell => {
                        let rgb = activeSliders.has(1) && activeSliders.has(2) ?
                            [(cell.y * W + cell.x) * rgb1dFactor, values[1], values[2]]
                            : (activeSliders.has(0) && activeSliders.has(2) ?
                            [values[0], (cell.y * W + cell.x) * rgb1dFactor, values[2]]
                            : [values[0], values[1], (cell.y * W + cell.x) * rgb1dFactor]);
                        cell.style.backgroundColor = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
                    });
                    break;
            }   // END switch 
            break;      // not needed at present; leave for safety in case more code added above          
        case 1:     // Handle HSL cases
            switch (activeSliders.activeCount) {
                case 1: 
                    setStatus(`${names[activeSliders.first]}:  ${values[activeSliders.first]} `);
                    cells.forEach(cell => {
                        let hsl = activeSliders.has(3) ? [values[3], cell.x * 100 / W, cell.y * maxLightness / (H - 1) + minLightness]
                            : (activeSliders.has(4) ? [cell.x * 360 / W, values[4], cell.y * maxLightness / (H - 1) + minLightness]
                            : [cell.x * 360 / W, cell.y * 100 / H, values[5]]);
                        cell.style.backgroundColor = `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`;
                    });
                    break;
                case 2:
                    setStatus(`${names[activeSliders.first]}:  ${values[activeSliders.first]}, ${names[activeSliders.second]}:  ${values[activeSliders.second]}`);
                    cells.forEach(cell => {
                        let hsl = activeSliders.has(4) && activeSliders.has(5) ?
                            [(cell.y * W + cell.x) * hueFactor, values[4], values[5]]
                            : (activeSliders.has(3) && activeSliders.has(5) ?
                            [values[3], (cell.y * W + cell.x) * slFactor, values[5]]
                            : [values[3], values[4], (cell.y * W + cell.x) * slFactor]);
                        cell.style.backgroundColor = `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`;
                    });
                    break;
            }   // END switch
            break;   // not needed at present; leave for safety in case more code added above
    }   // END outermost switch 
    cells.forEach(cell => {
        let span = cell.firstChild;
        colour = cell.style.backgroundColor;
        hex = rgb2Hex(colour);
        span.innerText = showLum ? `${getLuminance(colour).toFixed(2)}` : (showHex ? hex : NBSP);
        // span.style.opacity = showHex ? 1 : 0;
        span.style.color = getLuminance(cell.style.backgroundColor) > 0.3 ? BLACK : WHITE;
    });
}   // END generate()

function setStatus(text) {
    status.innerHTML = `<pre><code>${text}</code></pre>`;
}

function simulateSliderInput(slider) {
    simulateMouseEvent(rangeSliders[slider], `input`);
}

function getCssVarList(colours) {
    let prefix = `--col-`;
    let i = -1;
    let varList = [];
    for (let col of colours) {
        varList[++i] = prefix + i + `: ` + rgb2Hex(col) + SEMICOLON;  
    }
    return varList;
}

// https://developer.mozilla.org/samples/domref/dispatchEvent.html
function simulateMouseEvent(target, eventType) {
    let ev = document.createEvent("MouseEvents");
    ev.initMouseEvent(eventType, true, true, window,
      0, 0, 0, 0, 0, false, false, false, false, 0, null);
    target.dispatchEvent(ev);
}
