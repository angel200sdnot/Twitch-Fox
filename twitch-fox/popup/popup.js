/*
  Build the user interface, including streams, games, clips, videos, and their followed equivalents
  Use the Twitch API to perform searches
  Allow the user to authorize and deauthorize their account with Twitch
*/

var bp = browser.extension.getBackgroundPage();
var authorizedUser;
var mode;
var showNewUser;
var showWhatsNew;
var version = browser.runtime.getManifest().version;

var settings = document.getElementById("settings");
var search = document.getElementById("search");
var avatar = document.getElementById("avatar");
var login = document.getElementById("login");
var loginText = document.getElementById("loginText");
var contentArea = document.getElementById("contentArea");
var aboutPage = document.getElementById("aboutPage");
var aboutWhatsNewButton = document.getElementById("aboutWhatsNewButton");
var aboutTellMoreButton = document.getElementById("aboutTellMoreButton");
var addonPage = document.getElementById("addonPage");
var githubPage = document.getElementById("githubPage");
var steamPage = document.getElementById("steamPage");
var screenLock = document.getElementById("screenLock");
var enlargedPreview = document.getElementById("enlargedPreview");
var enlargedContent = "";
var newEnlarged;
var oldEnlarged;

function delimitNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, browser.i18n.getMessage("delimiter"));
}

function setMode(newMode) {
  /*
    Set the mode in both the script and the storage
  */
  mode = newMode;
  bp.setStorage('mode', newMode);
}

function initialize() {
  /*
    Initalizes the popup interface, essentially ensuring that all non-dynamic content (streams, games, etc.) is properly diplayed
    Includes internationalization, proper tooltips, etc.
  */
  
  console.log("initalize()");
  
  //Get the storage data for a few popup-specific things

  
  if (bp.getStorage('lastVersion') != version) {
    bp.setStorage('lastVersion', version);
    setMode("about");
    bp.setStorage('showWhatsNew', true);
  }
  
  mode = bp.getStorage('mode');
  showNewUser = bp.getStorage('showNewUser');
  showWhatsNew = bp.getStorage('showWhatsNew');
  
  authorizedUser = bp.authorizedUser;
  
  //Login/logout
  if (authorizedUser) {
    loginText.textContent = browser.i18n.getMessage("logout");
    avatar.classList.remove("noAccess");  
    avatar.style.backgroundImage = 'url("'+authorizedUser.logo+'")';
  } else {
    loginText.textContent = browser.i18n.getMessage("login");
    avatar.classList.add("noAccess");
    avatar.style.backgroundImage = '';
  }
  
  //Tooltips
  var tooltips = document.getElementsByClassName("tooltip");
  for(var i=0; i<tooltips.length; i+=1) {
    var tooltip = tooltips[i];
    if (!tooltip.id) continue;
    if (tooltip.id.substring(0, 8) == "followed") {
      if (authorizedUser) {
        tooltip.textContent = browser.i18n.getMessage(tooltip.id);
        tooltip.parentElement.classList.remove("noAccess");
      } else {
        tooltip.textContent = browser.i18n.getMessage("noAccessTip");
        tooltip.parentElement.classList.add("noAccess");
      }
    } else if (tooltip.id == "loginTip") {
      if (authorizedUser) {
        tooltip.textContent = browser.i18n.getMessage("logoutTip");
      } else {
        tooltip.textContent = browser.i18n.getMessage(tooltip.id);
      }
    } else if (tooltip.id == "avatarTip") {
      if (authorizedUser) tooltip.textContent = browser.i18n.getMessage(tooltip.id, authorizedUser.display_name);
    } else {
      tooltip.textContent = browser.i18n.getMessage(tooltip.id);
    }
  }

  //About tab
  var versionSpan = document.getElementById("version");
  versionSpan.textContent = browser.i18n.getMessage(versionSpan.id, version);
  var aboutTextNewUser = document.getElementById("aboutTextNewUser");
  var aboutTextWhatsNew = document.getElementById("aboutTextWhatsNew");
  var aboutTextAbout = document.getElementById("aboutTextAbout");
  
  if (showNewUser) {
    aboutTextNewUser.classList.remove("hide");
    aboutTextWhatsNew.classList.add("hide");
    aboutTextAbout.classList.add("hide");
  } else if (showWhatsNew) {
    aboutTextNewUser.classList.add("hide");
    aboutTextWhatsNew.classList.remove("hide");
    aboutTextAbout.classList.add("hide");
  } else {
    aboutTextNewUser.classList.add("hide");
    aboutTextWhatsNew.classList.add("hide");
    aboutTextAbout.classList.remove("hide");
  }
  
  var aboutTexts = document.getElementsByClassName("aboutText");
  for(var i=0; i<aboutTexts.length; i+=1) {
    var aboutText = aboutTexts[i];
    aboutText.textContent = browser.i18n.getMessage(aboutText.id, version);
    /*aboutText.textContent = aboutText.classList.contains("version") ? aboutText.textContent = browser.i18n.getMessage(aboutText.id, version) : browser.i18n.getMessage(aboutText.id);*/
  }
  
  var aboutButtons = document.getElementsByClassName("aboutButton");
  for(var i=0; i<aboutButtons.length; i+=1) {
    var aboutButton = aboutButtons[i];
    if (aboutButton.id == "aboutWhatsNewButton" && !showWhatsNew) {
      //Special case where we jump straight from new user screen to general about screen
      aboutButton.textContent = browser.i18n.getMessage("aboutTellMoreButton");
    } else {
      aboutButton.textContent = browser.i18n.getMessage(aboutButton.id, version);
    }
  }
  
  var email = document.getElementById("email");
  var discord = document.getElementById("discord");
  email.textContent = browser.i18n.getMessage(email.id, "hunter8750@gmail.com");
  discord.textContent = browser.i18n.getMessage(discord.id, "Hunter#3581");
  
  //Select current tab
  if (document.getElementById(mode).classList.contains("noAccess")) {
    //You don't want people to remain on a tab after it becomes unusable
    document.getElementById(mode).classList.remove("selected");
    setMode("games");
  }
  document.getElementById(mode).classList.add("selected");
  
  //Show about page if it is the tab, hide otherwise
  tabChange();
}

function addTooltip(parent, noDisable) {
  var tooltip = document.createElement("span");
  tooltip.classList.add("tooltip");
  if (noDisable) tooltip.classList.add("noDisable");
  parent.appendChild(tooltip);
  return tooltip;
}

function addCard(content, type) {
  switch (type) {
    case 'game':
      var id = "GAME!" + content.game._id;
      if (document.getElementById(id)) {
        return;
      }
      var contentDiv = document.createElement("div");
      contentDiv.classList.add("content", "game");
      contentDiv.id = id;
      
      var contentBack = document.createElement("div");
      contentBack.classList.add("contentBack", "game");
      contentBack.style.backgroundImage = 'url("'+ content.game.box.medium +'")'
      contentDiv.appendChild(contentBack);
      
      var hoverBack = document.createElement("div");
      hoverBack.classList.add("hoverBack", "game");
      contentBack.appendChild(hoverBack);
      
      var hideUntilHover = document.createElement("div");
      hideUntilHover.classList.add("hideUntilHover");
      contentBack.appendChild(hideUntilHover);
      
      var twitchButton = document.createElement("div");
      twitchButton.classList.add("contentButton", "bottom", "game", "twitch");
      twitchButton.addEventListener("click", () => {
        var url = "https://www.twitch.tv/directory/game/" + content.game.name;
        browser.tabs.create({url: url});
      })
      addTooltip(twitchButton).textContent = browser.i18n.getMessage("openTwitchPageTip");
      hideUntilHover.appendChild(twitchButton);
      
      var streamsButton = document.createElement("div");
      streamsButton.classList.add("contentButton", "side", "game", "smallStreams");
      streamsButton.addEventListener("click", () => {
        //In-searching
        
        getSearch("Get Live Streams", content.game.name);
        
      })
      addTooltip(streamsButton).textContent = browser.i18n.getMessage("gameStreamsTip", content.game.name);
      hideUntilHover.appendChild(streamsButton);
      
      var videosButton = document.createElement("div");
      videosButton.classList.add("contentButton", "side", "game", "smallVideos");
      videosButton.addEventListener("click", () => {
        console.log("videosButton");
      })
      addTooltip(videosButton).textContent = browser.i18n.getMessage("gameVideosTip", content.game.name);
      hideUntilHover.appendChild(videosButton);
      
      var clipsButton = document.createElement("div");
      clipsButton.classList.add("contentButton", "side", "game", "smallClips");
      clipsButton.addEventListener("click", () => {
        console.log("clipsButton");
      })
      addTooltip(clipsButton).textContent = browser.i18n.getMessage("gameClipsTip", content.game.name);
      hideUntilHover.appendChild(clipsButton);
      
      var gameTitle = document.createElement("span");
      gameTitle.classList.add("gameTitle");
      contentDiv.appendChild(gameTitle);
      
      var bottomTextTop = document.createElement("div");
      bottomTextTop.classList.add("bottomText", "gameTop");
      bottomTextTop.textContent = content.game.name  ;
      gameTitle.appendChild(bottomTextTop);
      addTooltip(gameTitle, true).textContent = content.game.name;
      
      var bottomTextBottom = document.createElement("div");
      bottomTextBottom.classList.add("bottomText", "gameBottom");
      bottomTextBottom.textContent = browser.i18n.getMessage("viewersOnGame", delimitNumber(content.viewers));
      contentDiv.appendChild(bottomTextBottom);
      
      var tag = document.createElement("span");
      tag.classList.add("tag");
      tag.textContent = content.game.name;
      contentDiv.appendChild(tag);
      contentArea.appendChild(contentDiv);
      
      break;
    case "stream":
      var id = "STREAM!" + content._id;
      if (document.getElementById(id)) {
        return;
      }
      var contentDiv = document.createElement("div");
      contentDiv.classList.add("content", "stream");
      contentDiv.id = id;
      
      var contentBack = document.createElement("div");
      contentBack.classList.add("contentBack", "stream");
      contentBack.style.backgroundImage = 'url("'+ content.preview.large +'")'
      contentDiv.appendChild(contentBack);
      
      var hoverBack = document.createElement("div");
      hoverBack.classList.add("hoverBack", "stream");
      contentBack.appendChild(hoverBack);
    
      var status = document.createElement("div");
      status.classList.add("status", "stream");
      status.textContent = content.channel.status;
      contentBack.appendChild(status);
      
      var created_at = new Date(content.created_at);
      var hours = created_at.getHours();
      var ampm = "AM";
      if (hours > 12) {
        hours -= 12;
        ampm = "PM";
      }
      var minutes = created_at.getMinutes();
      minutes = minutes < 10 ? "0" + minutes : minutes;
      var seconds = created_at.getSeconds();
      seconds = seconds < 10 ? "0" + seconds : seconds;
      
      var uptime_ms = Date.now() - created_at;
      var uptime_hr = Math.floor(uptime_ms / 3600000);
      var uptime_min = Math.floor((uptime_ms - (uptime_hr * 3600000)) / 60000);
      uptime_min = uptime_min < 10 ? ":0" + uptime_min : ":" + uptime_min;
      
      var uptimeIcon = document.createElement("div");
      uptimeIcon.classList.add("uptimeIcon");
      addTooltip(uptimeIcon, true).textContent = browser.i18n.getMessage("streamUptimeTip", [created_at.getMonth() + 1, created_at.getDate(), created_at.getFullYear(), hours, minutes, seconds, ampm]);
      contentBack.appendChild(uptimeIcon);

      var uptime = document.createElement("div");
      uptime.classList.add("uptime");
      uptime.textContent = uptime_hr+uptime_min;
      contentBack.appendChild(uptime);
      
      var hideUntilHover = document.createElement("div");
      hideUntilHover.classList.add("hideUntilHover");
      contentBack.appendChild(hideUntilHover);
      
      var twitchButton = document.createElement("div");
      twitchButton.classList.add("contentButton", "bottom", "stream", "twitch");
      twitchButton.addEventListener("click", () => {
        var url = content.channel.url;
        browser.tabs.create({url: url});
      })
      addTooltip(twitchButton).textContent = browser.i18n.getMessage("openTwitchPageTip");
      hideUntilHover.appendChild(twitchButton);
      
      var popoutButton = document.createElement("div");
      popoutButton.classList.add("contentButton", "bottom", "stream", "popout");
      popoutButton.addEventListener("click", () => {
        browser.windows.create({url: "http://player.twitch.tv/?channel=" + content.channel.name, height: 500, width: 850, type: "popup"});
      })
      
      addTooltip(popoutButton).textContent = browser.i18n.getMessage("openPopooutTip");
      hideUntilHover.appendChild(popoutButton);
      
      var chatButton = document.createElement("div");
      chatButton.classList.add("contentButton", "bottom", "stream", "chat");
      chatButton.addEventListener("click", () => {
        browser.windows.create({url: "http:/twitch.tv/" + content.channel.name +"/chat?popout", height: 600, width: 340, type: "popup"});
      })
      addTooltip(chatButton).textContent = browser.i18n.getMessage("openChatTip", content.channel.display_name);
      hideUntilHover.appendChild(chatButton);
      
      var enlargeButton = document.createElement("div");
      enlargeButton.classList.add("contentButton", "bottom", "stream", "enlarge");
      enlargeButton.addEventListener("click", () => {
        if (oldEnlarged && oldEnlarged.id != enlargedPreview.id) {
          screenLock.removeChild(oldEnlarged);
        }
        var rect = contentBack.getBoundingClientRect();
        newEnlarged = enlargedPreview.cloneNode();
        newEnlarged.id = "newEnlarged";
        contentDiv.classList.add("hidden");
        enlargedContent = contentDiv.id;
        enlargedPreview.style.backgroundImage = 'url("'+ content.preview.large +'")';
        enlargedPreview.style.left = rect.left + "px";
        enlargedPreview.style.top = rect.top + "px";
        enlargedPreview.style.transform = "translate(" + (-rect.left) + "px," + (131 - rect.top) + "px)";
        enlargedPreview.classList.add("enlarged");
        screenLock.classList.remove("hidden");
      })
      addTooltip(enlargeButton).textContent = browser.i18n.getMessage("enlargeTip");
      hideUntilHover.appendChild(enlargeButton);
      
      var favoriteButton = document.createElement("div");
      favoriteButton.classList.add("contentButton", "bottom", "stream", "favorite");
      favoriteButton.addEventListener("click", () => {
        //TODO
        //addFavorite()
      })
      addTooltip(favoriteButton).textContent = browser.i18n.getMessage("favoriteTip", content.channel.display_name);
      hideUntilHover.appendChild(favoriteButton);
      
      var followButton = document.createElement("div");
      followButton.classList.add("contentButton", "bottom", "stream", "follow");
      followButton.addEventListener("click", () => {
        //TODO
        //addFollow()
      })
      addTooltip(followButton).textContent = browser.i18n.getMessage("followTip", content.channel.display_name);
      hideUntilHover.appendChild(followButton);
      
      var videosButton = document.createElement("div");
      videosButton.classList.add("contentButton", "side", "stream", "smallVideos");
      videosButton.addEventListener("click", () => {
        //searchVideos()
      })
      addTooltip(videosButton).textContent = browser.i18n.getMessage("channelVideosTip", content.channel.display_name);
      hideUntilHover.appendChild(videosButton);
      
      var clipsButton = document.createElement("div");
      clipsButton.classList.add("contentButton", "side", "stream", "smallClips");
      clipsButton.addEventListener("click", () => {
        //searchClips()
      })
      addTooltip(clipsButton).textContent = browser.i18n.getMessage("channelClipsTip", content.channel.display_name);
      hideUntilHover.appendChild(clipsButton);
      
      if (content.game) {
        var cornerGame = document.createElement("div");
        cornerGame.classList.add("cornerGame");
        cornerGame.style.backgroundImage = 'url("https://static-cdn.jtvnw.net/ttv-boxart/' + content.game + '-52x72.jpg")';
        addTooltip(cornerGame, true).textContent = content.game;
        contentDiv.appendChild(cornerGame);
      }
      
      var displayName = document.createElement("span");
      displayName.classList.add("displayName");
      contentDiv.appendChild(displayName);
      
      var bottomText = document.createElement("div");
      bottomText.classList.add("bottomText", "stream");
      bottomText.textContent = browser.i18n.getMessage("viewersOnStream", [delimitNumber(content.viewers), content.channel.display_name]);
      displayName.appendChild(bottomText);
      addTooltip(displayName, true).textContent = content.channel.display_name + (content.channel.name != content.channel.display_name ? " (" + content.channel.name + ")" : "");
      
      var tag = document.createElement("span");
      tag.classList.add("tag");
      tag.textContent = content.game + content.channel.display_name + content.channel.name + content.channel.status;
      contentDiv.appendChild(tag);
      contentArea.appendChild(contentDiv);
      
      break;
    case "video":
      //Just wait until I'm done finalizing streams
      
      
      
    default:
      break;
  }
}

function tabChange(newMode) {
  /*
    Change the current selected tab and the mode
  */
  
  var results = bp.getResults();
  
  if (newMode) {
    document.getElementById(mode).classList.remove("selected");
    setMode(newMode);
  }
  document.getElementById(mode).classList.add("selected");
  while (contentArea.hasChildNodes()) {
    contentArea.removeChild(contentArea.firstChild);
  }
  if (mode == "about") {
    //Show the about page
    contentArea.classList.add("hide");
    aboutPage.classList.remove("hide");
  } else {
    //Show the content area
    aboutPage.classList.add("hide");
    contentArea.classList.remove("hide");
    if (results.length == 1 && results[0].content.length < 1) {
      //Tell the Twitch API to find us the information we want
      getAPIResults();
    } else {
      updatePage();
    }
  }
}

function getAPIResults() {
  switch(mode) {
    case "games":
      bp.twitchAPI("Get Top Games", {limit: bp.getStorage("resultLimit"), offset: contentArea.children.length}, (data) => {
        var results = bp.getResults();
        Array.prototype.push.apply(results[0].content, data.top);
        results[0].type = "game";
        results[0].scroll = contentArea.scrollTop;
        updatePage();
      });
      break;
    case "streams":
      bp.twitchAPI("Get Live Streams", {limit: bp.getStorage("resultLimit"), offset: contentArea.children.length}, (data) => {
        var results = bp.getResults();
        Array.prototype.push.apply(results[0].content, data.streams);
        results[0].type = "stream";
        results[0].scroll = contentArea.scrollTop;
        updatePage();
      });
      break;
    case "videos":
      bp.twitchAPI("Get Top Videos", {limit: bp.getStorage("resultLimit")}, (data) => {

        updatePage();
      });
      break;
    default:
      break;
  }
}

function getSearch(api, target, addition) {
  var results = bp.getResults();
  if (!addition) {
    bp.pushEmptyResult();
  }
  var len = results.length;
  switch(api) {
    case "Get Live Streams":
        bp.twitchAPI(api, {game: target, limit: bp.getStorage("resultLimit"), offset: contentArea.children.length}, (data) => {
          Array.prototype.push.apply(results[len - 1].content, data.streams);
          results[len - 1].type = "stream";
          results[len - 1].api = api;
          results[len - 1].target = target;
          results[len - 1].scroll = contentArea.scrollTop;
          updatePage();
        });
      break;
    default:
      break;
  }
}

function updatePage() {
  /*
    Create info cards from the info the Twitch API gathered
  */
  var results = bp.getResults();
  var len = results.length;
  
  while (contentArea.hasChildNodes()) {
    contentArea.removeChild(contentArea.firstChild);
  }
  for (var i = 0; i < results[len - 1].content.length; i += 1) {
    addCard(results[len - 1].content[i], results[len - 1].type);
  }
  contentArea.scrollTop = results[len - 1].scroll;
}

/*
  Click events
*/

//Big click event for non-specific elements
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("noAccess")) {
      //Do nothing I guess?
  } else if (e.target.classList.contains("tab") && e.target.id != mode) {
    bp.setResults(bp.defaultResults());
    tabChange(e.target.id);
  }
});

//Settings page
settings.addEventListener("click", () => browser.runtime.openOptionsPage());

//Search button
search.addEventListener("click", () => {
  //Debug
  contentArea.appendChild(contentArea.firstElementChild.cloneNode(true));
})

//Avatar
avatar.addEventListener("click", () => {
  if (authorizedUser) {
    var url = "https://www.twitch.tv/" + authorizedUser.name;
    browser.tabs.create({url: url});
  }
});

//Login/logout
login.addEventListener("click", () => {
    if (authorizedUser) {
      bp.deauthorize(initialize);
    } else {
      bp.authorize(initialize);
    }
});

//About page buttons
aboutWhatsNewButton.addEventListener("click", () => {
  showNewUser = false;
  bp.setStorage('showNewUser', showNewUser);
  initialize();
});

aboutTellMoreButton.addEventListener("click", () => {
  showWhatsNew = false;
  bp.setStorage('showWhatsNew', showWhatsNew);
  initialize();
}); 

addonPage.addEventListener("click", () => {
  var url = "https://addons.mozilla.org/en-US/firefox/addon/twitchfox/";
  browser.tabs.create({url: url});
})

githubPage.addEventListener("click", () => {
  var url = "https://github.com/Hunter5000/Twitch-Fox";
  browser.tabs.create({url: url});
})

steamPage.addEventListener("click", () => {
  var url = "http://steamcommunity.com/id/hunter7500/";
  browser.tabs.create({url: url});
})

screenLock.addEventListener("click", () => {
  screenLock.classList.add("hidden");
  document.getElementById(enlargedContent).classList.remove("hidden");
  enlargedPreview.classList.remove("enlarged");
  enlargedPreview.style.transform = "none";
  oldEnlarged = enlargedPreview;
  oldEnlarged.id = "oldEnlarged";
  
  enlargedPreview = newEnlarged;
  enlargedPreview.id = "enlargedPreview";
  screenLock.appendChild(enlargedPreview);
})


contentArea.addEventListener("scroll", () => {
  if(contentArea.scrollHeight - contentArea.scrollTop == 564) {
    var results = bp.getResults();
    var len = results.length;
    if (len > 1) {
      getSearch(results[len - 1].api, results[len-1].target, true)
    }
    else {
      getAPIResults();
    }
  }
})

browser.runtime.onMessage.addListener((request) => {
  if (request.content == "initialize") initialize();
});

initialize();



/*
var myButton = document.getElementById("myButton");

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("button")) {
    e.target.textContent = "Button pressed!";
    bp.testFunction((message) => console.log("Our message: " + message));
    bp.authorize(function(token) {
      console.log("Popup script got the token: "+token);
      e.target.textContent = token;
    });
  }
});*/










