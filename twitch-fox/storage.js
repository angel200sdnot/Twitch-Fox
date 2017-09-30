/*
  Initialize all storage variables
*/

//Default storage
const defaults = {
  //Non-settings
  token: '',
  mode: 'about',
  favorites: [],
  lastVersion: '',
  notifiedStreams: [],
  
  //Settings
  tooltips: true,
  showNewUser: true,
  showWhatsNew: true,
  favoritesFlashIcon: true,
  favoritesDesktopNotificiations: true,
  favoritesAudioNotificiations: false,
  nonfavoritesFlashIcon: false,
  nonfavoritesDesktopNotifications: false,
  nonfavoritesAudioNotificiations: false,
  alarmInterval: 1,
  limitAlarm: false,
  alarmLength: 10,
  alarmVolume: 50,
  minutesBetweenCheck: 1,
  resultLimit: 12
}

var storage = {};

function getStorage(key) {
  return storage[key];
}

function setStorage(key, value) {
  var obj = {};
  obj[key] = value;
  browser.storage.sync.set(obj).then(() => {
      if (key != "mode") {
        browser.runtime.sendMessage({
          content: "initialize"
        });
      }
  });
  storage[key] = value;
}

var keys = Object.keys(defaults);

browser.storage.sync.get(null).then((res) => {
  var prop;
  var val;
  for (var i=0; i<keys.length; i+=1) {
    prop = keys[i];
    if (i+1 < keys.length) {
      if (res[prop] == null) {
        val = defaults[prop];
        setStorage(prop, val);
      } else {
        storage[prop] = res[prop];
      }
    } else {
      //This is the last setting, so make sure to wake up the other scripts
      val = res[prop] == null ? defaults[prop] : res[prop];
      setStorage(prop, val, getAuthorizedUser);
    }
  }
})