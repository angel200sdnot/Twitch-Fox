/*
  Provide a method for the Twitch API to be easily accessed
*/

//Related constants
const accept = 'application/vnd.twitchtv.v5+json'; //Preferred version of Twitch API
const client_id = 'dzawctbciav48ou6hyv0sxbgflvfdpp'; //Twitch Fox registered client ID

var token; //The authorization token that will be required for certain API requests

var results = defaultResults();

function getResults() {
  return results;
}

function setResults(newResults) {
  results = newResults;
}

function myTest() {
  console.log("Hi");
}

function defaultResults() {
  return [{content: [], type: "", api: "", target: "", scroll: 0}];
}

function twitchAPI(endpoint, opts, callback) {
  /*
    "endpoint" expects a string describing the endpoint
    "opts" expects an object that may look like the example below:
    {
      channel: 121059319,
      game: 'Overwatch',
      language: 'en',
      stream_type: 'live',
      limit: '25',
      offset: '0'
    }
    "callback" expects the function to be called after the request is finished
  */
  console.log("twitchAPI function called");
  var init = {
    method: 'GET', 
    headers: {
      'Accept': accept,
      'Client-ID': client_id,
      'Authorization': 'OAuth ' + token
    }
  };
  var url;
  var params = Object.entries(opts).map(([key, val]) => `${key}=${val}`).join('&');
  switch (endpoint) {
    case 'Get User':
      url = 'https://api.twitch.tv/kraken/user?';
      break;
    case 'Get Top Games':
      url = 'https://api.twitch.tv/kraken/games/top?';
      break;
    case 'Get Live Streams':
      url = 'https://api.twitch.tv/kraken/streams/?';;
      break;
    case 'Get Top Videos':
      url = 'https://api.twitch.tv/kraken/videos/top?';
      break;
    default:
      break;
  }
  url = url + params;
  console.log("Preparing to send a request to the Twitch API");
  fetch(url, init).then((response) => {
    if (response.status == 200) response.json().then((data) => {
      callback(data);
    });
  });
}