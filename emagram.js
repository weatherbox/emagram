var url = "https://s3-ap-northeast-1.amazonaws.com/soundings/sounding-current.json.gz";

var width = 600, height = 600;

var margin = {top: 20, right: 10, bottom: 20, left: 30},
    w = 600 - margin.left - margin.right,
    h = 600 - margin.top - margin.bottom;

var basep = 1050,
    topp = 100;
    
var svg = d3.select("#emagram").append("svg")
    .attr("width", width)
    .attr("height", height);

var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleLinear().range([0, w]).domain([-80, 45]),
    y = d3.scaleLog().range([0, h]).domain([topp, basep]);

drawAxis();


d3.json(url, function(data){
    console.log(data);
});


function drawAxis(){
    // x: temp
    var xAxis = d3.axisBottom(x)
            .tickSize(-h).ticks(10);
    g.append("g")
        .attr("transform", "translate(0," + h + ")")
        .call(xAxis)
        .selectAll(".tick line").attr("stroke", "#ccc"); // grid lines

    // y: log pressure
    var plines = [1000,850,700,500,300,200,100],
        pticks = [950,900,800,750,650,600,550,450,400,350,250,150];
    var yAxis = d3.axisLeft(y)
            .tickSize(-w).tickValues(plines)
            .tickFormat(d3.format(".0d"));
    var yAxis2 = d3.axisRight(y)
            .tickSize(5).tickValues(pticks)
            .tickFormat("");

    g.append("g").call(yAxis)
        .selectAll(".tick:not(:last-of-type) line").attr("stroke", "#ccc"); // grid lines
    g.append("g").call(yAxis2);
}


