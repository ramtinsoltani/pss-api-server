const path = require('path');
const fs = require('fs-extra');

// Delete dist
fs.remove(path.join(__dirname, 'dist'));
