const express = require('express');
const helmet = require('helmet');
const path = require('path');
const bodyParser  = require('body-parser');
const RoomCrawler = require('./helpers/room_crawler');

const app = express();

app.use(helmet());

app.use(function (req, res, next) {
  console.log('%s %s %s', req.method, req.url, req.path);
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const router = express.Router();

router.use(express.static(path.join(process.cwd(), '.')));
router.get('/', function (res) {
    res.sendFile(path.join(process.cwd(), '.', 'index.html'));
});

router.post('/room', async (req, res, next) => {
    const url = req.body.roomUrl;
    if(/airbnb+((.co.uk)|(.com)+\/rooms\/)(.*)/.test(url)){
      await RoomCrawler(url).then((result) => {
        res.set('Content-Type', 'text/html');
        res.send(Buffer.from(`<pre>${JSON.stringify(result, undefined, 2)}</pre>`));
      }).catch((err) => {
        res.set('Content-Type', 'text/html');
        res.send(Buffer.from(`<p>There was an error processing your crawl request: ${err}</p>`));
      });
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
