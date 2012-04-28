var demo = new DemoApp();

demo.modules.push(new GameModule());
demo.modules.push(new ExploreModule());

$(document).ready(function(){ demo.start(); });
