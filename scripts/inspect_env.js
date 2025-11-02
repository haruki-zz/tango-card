const { app } = require('electron');
console.log('boot cwd', process.cwd());
console.log('boot env override', process.env.TANGO_CARD_DATA_DIR);
app.whenReady().then(() => {
  console.log('appPath', app.getAppPath());
  console.log('userData', app.getPath('userData'));
  app.exit(0);
});
