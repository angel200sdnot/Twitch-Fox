var bp = browser.extension.getBackgroundPage();

function initialize() {
  var notification = document.getElementById("notification");
  var audioNotification = document.getElementById("audioNotification");
  var unfavoriteAll = document.getElementById("unfavoriteAll");
  
  notification.style.display = bp.authorizedUser ? "inline" : "none";
  audioNotification.style.display = bp.getStorage('favoritesAudioNotificiations') || bp.getStorage('nonfavoritesAudioNotificiations') ? "inline" : "none";
  unfavoriteAll.style.display = bp.getStorage('favorites').length ? "inline" : "none";
  
  var i18ns = document.getElementsByClassName("i18n");
  for(var i=0; i<i18ns.length; i+=1) {
    var i18n = i18ns[i];
    if (i18n.classList.contains("button")) {
      i18n.value = browser.i18n.getMessage(i18n.id);
    } else {
      i18n.textContent = browser.i18n.getMessage(i18n.id);
    }
  }

  var checkboxes = document.getElementsByClassName("checkbox");
  for(var i=0; i<checkboxes.length; i+=1) {
    var checkbox = checkboxes[i];
    checkbox.checked = bp.getStorage(checkbox.id);
    checkbox.addEventListener('change', (e) => {
      checkbox = e.target;
      bp.setStorage(checkbox.id, checkbox.checked);
    })
  }

  var numbers = document.getElementsByClassName("number");
  for(var i=0; i<numbers.length; i+=1) {
    var number = numbers[i];
    number.value = bp.getStorage(number.id);
    number.addEventListener('change', (e) => {
      number = e.target;
      var val = Number(number.value);
      var min = number.min;
      var max = number.max;
      val = isNaN(val) ? bp.getStorage(number.id) : val;
      if (min !== '') val = val < min ? min : val;
      if (max !== '') val = val > max ? max : val;
      number.value = val;
      bp.setStorage(number.id, val);
    })
  }
}

unfavoriteAll.addEventListener('click', () => {
  bp.setStorage('favorites', []);
})

browser.runtime.onMessage.addListener((request) => {
  if (request.content == "initialize") initialize();
});

initialize();