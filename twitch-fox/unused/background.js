//Codeflow for Twitch authorization:
//1: Create a listener for a new tab matching the redirect URI
//2: When opened, execute a script in that tab that sends a message back to the main script with http params
//3: Receive the message. If properly received, plan to remove the tab and then parse the access code from the received params

/*const redirectURI = 'https://hunter5000.github.io/twitchfox.html';

var injectScript = function (){
  
    console.log("\n\nInjecting\n\n");

    var sendMessage = function (msg){

      var data = {
        value: msg,
        type : "OAUTH2"
      };

      browser.runtime.sendMessage(data);
    }

    var send = function (){

      var params = window.location.href;

      console.log("\nSending back to background message = ", params);

      sendMessage({params: params});
    }
    send();
}

browser.tabs.onUpdated.addListener(function (tabId, changeInfo){
  var injection = '(' + this.injectScript.toString() + ')()';
  if ( changeInfo.url && changeInfo.url.indexOf(redirectURI) != -1 ) {
    console.log("\nExecuting scripts");
    browser.tabs.executeScript(tabId, {code: injection});
  }
});

browser.runtime.onMessage.addListener(function (msg, sender, sendResponse){
  if ( msg.type == "OAUTH2" ) {
    //self.finalize(msg.value.params);
    console.log(msg.value.params);
    setTimeout(function (){
      browser.tabs.remove(sender.tab.id);
    }, 100);
  }
});*/

var popupWindow;
var displayToken;

function pingConsole(text) {
  console.log(text);
}


function login() {
  //Log in to Twitch by obtaining an authorization token
  var twitchOauth = addAdapter({
      id: 'twitch',
      codeflow: {
          method: "POST",
          url: "https://api.twitch.tv/kraken/oauth2/token"
      },
      opts: {
          api: "https://api.twitch.tv/kraken/oauth2/authorize",
          response_type: 'token',
          client_id: 'dzawctbciav48ou6hyv0sxbgflvfdpp',
          client_secret: 'b1smws17iv8ob4wpbi4671mf6ceus3r',
          scope: 'user_follows_edit user_read',
          redirect_uri: 'https://hunter5000.github.io/twitchfox.html'
      }
  });
  twitchOauth.authorize(function () {
    //We have obtained a token, or at least a response
    var response = twitchOauth.getAccessToken();
    if (response) {
      console.log(response);
      displayToken(response);
    }
  });
}


function handleMessage(request, sender, sendResponse) {
  console.log("Message from the popup script: " +
    request.greeting);
  sendResponse({response: "Response from background script"});
}

browser.runtime.onMessage.addListener(handleMessage);












