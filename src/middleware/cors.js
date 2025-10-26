const cors = require('cors');

const corsOptions = {
  origin: ['https://app.moneypath.in', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

module.exports = cors(corsOptions);
