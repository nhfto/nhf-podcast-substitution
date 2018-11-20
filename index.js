const express = require('express');
const Promise = require('bluebird');
const https = require('https');
const xml2js = Promise.promisifyAll(require('xml2js'));


const app = express();

const config = {
  url: 'https://podsync.net/gDq_XrTLx',
  title: 'NHF Uptown Sermons',
  author: 'New Hope Fellowship Church',
  cover: 'https://uptown.nhflive.ca/podcover.png',
};

// hit the podcast server
// replace the stuff
// send!
app.get('/podcast', (req, res) => {
  let dat = '';

  Promise.resolve()
  .then(() => new Promise((res,rej) => {
    https.get(config.url, (getdat) => {
      if (getdat.statusCode == 200) {
        res(getdat);
      } else {
        rej(getdat);
      }
    });
  }))
  .then((res) => {
    res.on('data', function (chunk) {
      dat += chunk;
    });

    return Promise.fromCallback((cb) => res.on('end', cb));
  })
  .then(() => {
    return xml2js.parseStringAsync(dat);
  })
  .then((jspod) => {
    jspod.rss.channel[0].title = [config.title];
    
    jspod.rss.channel[0].image[0].url = [config.cover];
    jspod.rss.channel[0].image[0].title = [config.title];

    jspod.rss.channel[0]['itunes:author'] = [config.author];
    jspod.rss.channel[0]['itunes:subtitle'] = [config.title];
    jspod.rss.channel[0]['itunes:image'][0]['$'].href = config.cover;

    for (let kk = 0; kk < jspod.rss.channel[0].item.length; kk++) {
      jspod.rss.channel[0].item[kk]['itunes:author'] = [config.author];
      jspod.rss.channel[0].item[kk]['itunes:image'] = [{$: {href: config.cover}}];
    }

    const builder = new xml2js.Builder();
    let xml = builder.buildObject(jspod);

    res.set('Content-Type', 'text/xml');
    res.send(xml);
  })
  .catch((e) => {
    console.error(e);
  })
});

app.listen(8100, () => console.log('Listening!'));
