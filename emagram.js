var url = "https://s3-ap-northeast-1.amazonaws.com/soundings/sounding-current.json.gz";

var emagram = new Emagram("#emagram", 600, 600);
var id = '47778';

d3.json(url, function(data){
    console.log(data);
    title(data[id]);
    emagram.plot(data[id]);
});

function title(data){
    var time = d3.timeParse("%y%m%d/%H%M")(data.indices.TIME); // 180218/0000
    var timestr = d3.timeFormat("%HZ %d %b %Y")(time);
    d3.select("h2").text(data.name + "  " + timestr);
}

