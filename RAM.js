// script für den Puck
//     D2 wird auf LOW gesetzt (digitalWrite(D2, 0)).
//     D1 wird als Eingang konfiguriert, mit einem internen Pull-Up-Widerstand ("input_pullup"). 
//     Das Array d speichert die Zeitdifferenzen zwischen Signalflanken (HIGH → LOW oder LOW → HIGH).
var on= [];
var off =[];

digitalWrite(D2,0);
pinMode(D1,"input_pullup");
var d = [];
// 
setWatch(function(e) {
  d.push(1000*(e.time-e.lastTime));

}, D1, {edge:"both",repeat:true});

var lastLen = 0;
setInterval(function() {
  if (d.length && d.length==lastLen) {
    d.shift(); // remove first element
    console.log(d.map(a=>a.toFixed(1)).toString());
    d=[];
  }
  lastLen = d.length;
},200);

//Dokumentation Puck Funktionen: https://www.espruino.com/Reference#l__global_setWatch
//
//
//