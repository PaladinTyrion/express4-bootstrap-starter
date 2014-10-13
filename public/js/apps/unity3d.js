$(function() {

  var config = {
    width: 960,
    height: 600,
    params: { enableDebugging:"0" }

  };
  var u = new UnityObject2(config);

  //load u3d-model
  var $missingScreen = $("#unityPlayer").find(".missing");
  var $brokenScreen = $("#unityPlayer").find(".broken");
  $missingScreen.hide();
  $brokenScreen.hide();

  u.observeProgress(function (progress) {
    switch (progress.pluginStatus) {
      case "broken":
        $brokenScreen.find("a").click(function (e) {
          e.stopPropagation();
          e.preventDefault();
          u.installPlugin();
          return false;
        });
        $brokenScreen.show();
        break;
      case "missing":
        $missingScreen.find("a").click(function (e) {
          e.stopPropagation();
          e.preventDefault();
          u.installPlugin();
          return false;
        });
        $missingScreen.show();
        break;
      case "installed":
        $missingScreen.remove();
        break;
      case "first":
        break;
    }
  });
  u.initPlugin($("#unityPlayer")[0], "theater.unity3d");
});
