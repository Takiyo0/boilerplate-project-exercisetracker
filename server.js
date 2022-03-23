const express = require('express');
const Api = require("./routes/api");
const bodyParser = require("body-parser");
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use("/api", Api());
app.use(express.static('public'));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 2080, () => {
    console.log('Your app is listening on port ' + listener.address().port)
})
