var demo = new DemoApp();

demo.modules.push(new GameModule());
demo.modules.push(new ExploreModule());
demo.modules.push(new ChallengeModule());

$(document).ready(function(){ demo.start(); });
