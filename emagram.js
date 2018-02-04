var url = "https://s3-ap-northeast-1.amazonaws.com/soundings/sounding-current.json.gz";

var w = 600, h = 500;

var basep = 1050,
    topp = 100,
    plines = [1000,850,700,500,300,200,100],
    pticks = [950,900,800,750,650,600,550,450,400,350,250,150];

init();
d3.json(url, function(data){
    console.log(data);
});


function init(){
    var svg = d3.select("#emagram").append("svg")
        .attr("width", w)
        .attr("height", h);

    var x = d3.scale.linear().range([0, w]).domain([-80, 45]),
        y = d3.scale.log().range([0, h]).domain([topp, basep]);
}


function drawBackground(){

}


