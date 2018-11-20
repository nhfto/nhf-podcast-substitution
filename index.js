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

  // connect to podsync
  .then(() => new Promise((res,rej) => {
    https.get(config.url, (getdat) => {
      if (getdat.statusCode == 200) {
        res(getdat);
      } else {
        rej(getdat);
      }
    });
  }))

  // wait for data
  .then((res) => {
    res.on('data', function (chunk) {
      dat += chunk;
    });

    return Promise.fromCallback((cb) => res.on('end', cb));
  })

  // parse xml into JS object
  .then(() => {
    return xml2js.parseStringAsync(dat);
  })

  // make edits
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

    // convert JS object back to XML
    const builder = new xml2js.Builder();
    let xml = builder.buildObject(jspod);

    // send to client
    res.set('Content-Type', 'text/xml');
    res.send(xml);
  })
  .catch((e) => {
    console.error(e);
  });
});

app.listen(8100, () => console.log('Listening!'));
