const cheerio = require('cheerio');
const https = require('https');
const he = require('he'); 

// const query = 'https://www.airbnb.co.uk/rooms/28299515';
const query = process.env.URL;
const opts = require('url').parse(query);

opts.headers = {
  'User-Agent': 'javascript'
};

// Add url filter to airbnb domains
const fetch = (url) => {
  console.log('Processing', url);
  return new Promise(function (resolve, reject) {
      https.get(url, opts, function (res) {
          let body = "";
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
              body += chunk;
          });
          res.on('end', function () {
              resolve(body);
          })
      });
  });
};

fetch(query).then(function(body) {
  const $ = cheerio.load(body);
  
  // Sections
  const title = he.decode($('h1 span').html());
  const location = he.decode($('div [data-location] a').html().replace(/<(?:.|\n)*?>/gm, ''));

  // Summary
  const extract = {};
  const extractList = he.decode($('#summary').next('div').children('div').html().replace(/<(?:.|\n)*?>/gm, '!*!'))
    .split('!*!').filter(item => item != '' && item != ' · ' && item != ' ')
    .reduce((arr, item) => arr.includes(item) ? arr : [...arr, item], []);
  const extractPoints = extractList.filter(item => !/[A-Za-z0-9%]/.test(item))
    .map((item) => extractList.indexOf(item));
  // Use extractPoints as markers in list
  for (let i  = 0; i < extractPoints.length; i += 1){
    const extractName = extractList[extractPoints[i] + 1];
    const extractProps = extractList.slice(extractPoints[i] + 2, extractPoints[i + 1]);
    extract[extractName] = extractProps;
  }

  // Description
  const description = he.decode($('#details').html().replace(/<(?:.|\n)*?>/gm, '!*!'))
    .split('!*!')
    .filter(item => item != '' && !/Contact host/.test(item) && !/Read more/.test(item) && !/translated by Google/.test(item))
    .join("\n");

  // Amenities section
  let amenitiesList;
  $('#amenities section').each((index, section) => {
    const amenitieTitle = he.decode($(section).find('h2').html().replace(/<(?:.|\n)*?>/gm, ''));
    const amenitieContent = he.decode($(section).find('div').next('div').html().replace(/<(?:.|\n)*?>/gm, '!*!')).split('!*!').filter(item => item != '');
    return amenitiesList = amenitieContent;
  });

  // Arrangements section
  const arrangements = {};
  const arrangementsFullSection = he.decode($('#amenities').next('div').contents('section').html().replace(/<(?:.|\n)*?>/gm, '!*!'))
    .split('!*!')
    .filter(item => item != '' && item != ' ');
  if(arrangementsFullSection){
    arrangementsFullSection.shift();
    arrangementsFullSection.forEach((arrangement, index, arr) => {
      if(index % 2 == 0){
        return arrangements[arrangement] = arr[index + 1];
      }
      return arrangements;
    });
  }

  // Host profile
  const hostProfileHost = $('#host-profile section h2').text();
  const allHostProfileInfo = he.decode($('#host-profile section').html().replace(/<(?:.|\n)*?>/gm, '!*!'))
    .split("!*!")
    .filter(item => item != '' && /[A-Za-z0-9%]/.test(item) && item != ' · ' && item != ' ');
  const hostProfileInfo = {};
  hostProfileInfo.host = allHostProfileInfo.find(item => /Hosted by/.test(item));
  hostProfileInfo.joined = allHostProfileInfo.find(item => /Joined/.test(item));
  hostProfileInfo.reviews = allHostProfileInfo.find(item => /Reviews/.test(item));
  hostProfileInfo.verified = allHostProfileInfo.find(item => /Verified/.test(item));
  hostProfileInfo.interaction = allHostProfileInfo[allHostProfileInfo.indexOf(allHostProfileInfo.find(item => /Interaction/.test(item))) + 1];
  hostProfileInfo.response_rate = allHostProfileInfo[allHostProfileInfo.indexOf(allHostProfileInfo.find(item => /Response rate/.test(item))) + 1];
  hostProfileInfo.response_time = allHostProfileInfo[allHostProfileInfo.indexOf(allHostProfileInfo.find(item => /Response time/.test(item))) + 1];
  hostProfileInfo.about = allHostProfileInfo[allHostProfileInfo.indexOf(allHostProfileInfo.find(item => /About this place/.test(item))) + 2];

  // House rules
  const houseRules = he.decode($('#house-rules').html().replace(/<(?:.|\n)*?>/gm, '!*!'))
    .split("!*!")
    .filter(item => item != '' && /[A-Za-z0-9%]/.test(item) && item != ' · ' && item != ' ');
  const houseRulesHeader = houseRules.indexOf("House Rules");
  if(houseRulesHeader != -1){
    houseRules.splice(houseRulesHeader, 1);
  }
  const houseRulesEnd = houseRules.indexOf("Read all rules");
  if(houseRulesEnd != -1){
    houseRules.splice(houseRulesEnd, 1);
  }

  // Map of all relevant images
  const imageList = {};
  $('img').filter((index,image) => !!$(image).attr('class')).each((i, filteredImage) => {
    const imageName = filteredImage.attribs.alt || i;
    return imageList[imageName] = filteredImage.attribs.src;
  });

  const aibnbFormattedResults = {
    title: title,
    location: location,
    extract: extract,
    description: description,
    amenities: amenitiesList,
    arrangements: arrangements,
    host: {
      profile: hostProfileHost,
      information: hostProfileInfo
    },
    house_rules: houseRules,
    images: imageList
  };

  console.log(aibnbFormattedResults)

  return aibnbFormattedResults;
}).catch((err) => {
  throw new Error(err);
});