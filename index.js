const express = require('express');
const path = require('path');
const bodyParser  = require('body-parser');

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

app.use(router);

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Server is listening on port ${port}.`)
);

module.exports = app;
