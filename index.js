const express = require('express')
const cors = require('cors');
const port = process.env.PORT || 5000;

const app = express();
//middleware
app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
    res.send('second home dot com is running');
});

app.listen(port, () => {
    res.send(`second home is now running in port ${port}`)
});