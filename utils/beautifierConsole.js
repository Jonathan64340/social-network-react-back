/**
 * @author Domingues Jonathan
 * date: 12/12/2021
 * @version 0.1
 */

// Theme logs
const colorsLogs = require('../configs/colors_logs.json');

/**
 * @param {string} key
 * @param {string} string
 * @returns {string} return color style with string in the output 
 */
module.exports = (key, string) => {
    if (!key && !string || typeof key !== 'string' || typeof string !== 'string') return '';
    if (colorsLogs.hasOwnProperty(key)) {
        console.log(colorsLogs[key], string);
        console.log('\u001b[0m', '');
    } else {
        console.log(string);
        console.log('\u001b[0m', '');
    }
}