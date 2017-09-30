/*
  Declare authorization-related constants
  Check whether the user is authorized on startup or not
  Manage authorization and unauthorization
*/

const redirect_uri = 'https://hunter5000.github.io/twitchfox.html'; //TwitchFox registered redirect URI
const scope = 'user_follows_edit user_read'; //Space-separated permissions that we must obtain from Twitch
const response_type = 'token'; //The response type we're looking for from the authorization process
var authorizedUser; //(Eventually) An object containing the data of the authorized user
var injection = 'browser.runtime.sendMessage({content: window.location.href, type: "OAuth"});'; //The code we will inject into the redirect URI to inform us of the token or of any errors

//Add a listener for new tabs to see if the redirect URI was opened
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url && changeInfo.url.indexOf(redirect_uri) != -1 ) {
    console.log("Executing script");
    browser.tabs.executeScript(tabId, {code: injection});
  }
})

//And a listener for receiving a message from the injected code
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type == "OAuth") {
    browser.tabs.remove(sender.tab.id);
    token = parseToken(request.content);
    console.log("We got a token! It's: " + token);
    setStorage('token', token);
    getAuthorizedUser();
  }
});

function authorize(callback) {
  /*
    Sends the user to the authorization page
  */
  var url = 'https://api.twitch.tv/kraken/oauth2/authorize?client_id='+client_id+'&redirect_uri='+redirect_uri+'&response_type='+response_type+'&scope='+scope; //The URL we must send the user to for authentication
  browser.tabs.create({url: url});

}

function deauthorize(callback) {
  /*
    Deletes the token from storage
    I can't get this to actually revoke the token properly without getting a "Cross-Origin Request Blocked" message, maybe I will eventually resolve this
    Here is the start of the code I had:
    
    var url = 'https://api.twitch.tv/kraken/oauth2/revoke?client_id='+client_id+'&token='+token;
    var init = {method: 'POST'};
    fetch(url, init).then((response) => {
  */
  setStorage('token', '');
  token = '',
  authorizedUser = null;
  callback();
}

function getAuthorizedUser() {
  /*
    When called, attempts to use the Twitch API to get the data of the current authorized user
  */
  console.log("getAuthorizedUser()");
  twitchAPI('Get User', {}, (data) => {
    authorizedUser = data;
    browser.runtime.sendMessage({
      content: "initialize"
    });
  });
}

function parseToken(url) {
  var error = url.match(/[&\?]error=([^&]+)/);
  if (error) {
    console.log('Error getting access token: ' + error[1]);
    return null;
  } else return url.match(/[&#]access_token=([\w\/\-]+)/)[1];
}
