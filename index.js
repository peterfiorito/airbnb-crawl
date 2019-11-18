const express = require('express');
const path = require('path');
const bodyParser  = require('body-parser');
const RoomCrawler = require('./helpers/room_crawler');

const app = express();

app.use(function (req, res, next) {
  console.log('%s %s %s', req.method, req.url, req.path);
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const router = express.Router();
router.get('/example', (req, res) => res.json({ route: req.originalUrl }));

router.use(express.static(path.join(process.cwd(), '.')));
router.get('/', function (res) {
    res.sendFile(path.join(process.cwd(), '.', 'index.html'));
});

router.post('/room', async (req, res, next) => {
    const url = req.body.roomUrl;
    if(/airbnb+((.co.uk)|(.com)+\/rooms\/)(.*)/.test(url)){
      const crawl = await RoomCrawler(url);
      res.set('Content-Type', 'text/html');
      res.send(Buffer.from(`<pre>${JSON.stringify(crawl, undefined, 2)}</pre>`));
    } else {
      res.json({error: `${url} doesn't match airbnb room url shape eg. 'https://www.airbnb.co.uk/rooms/28299515`})
    }
});

app.use(router);

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Server is listening on port ${port}.`)
);

module.exports = app;
