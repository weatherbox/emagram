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
var lineg = g.append("g");

var x = d3.scaleLinear().range([0, w]).domain([-80, 45]),
    y = d3.scaleLog().range([0, h]).domain([topp, basep]);

drawAxis();
clipping();
drawDryAdiabats();

d3.json(url, function(data){
    drawSounding(data['47778']);
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


// clip adiabats
// .attr("clip-path", "url(#clipper)")
function clipping(){
    g.append("clipPath")
        .attr("id", "clipper")
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", w)
        .attr("height", h);
}


function drawDryAdiabats(){
    var pp = d3.range(topp, basep+1, 10); // plot points
    var dryad = d3.range(-60, 260, 20);

    var dryline = d3.line()
        .x(function(d,i) { return x(potentialTemperature(d, pp[i])); })
        .y(function(d,i) { return y(pp[i]); });

    var linepoints = []; // dryad x pp matrix
    for (var t of dryad){
        linepoints.push(Array(pp.length).fill(t));
    }

    g.selectAll(".dryline")
        .data(linepoints)
        .enter().append("path")
          .attr("fill", "none")
          .attr("stroke", "#ccc")
          .attr("d", dryline)
          .attr("clip-path", "url(#clipper)");
}

// ref. https://en.wikipedia.org/wiki/Potential_temperature
function potentialTemperature(t, p){
    return (273.15 + t) / Math.pow((1000 / p), 0.286) - 273.15;
}


/*
sounding data
-----------------------------------------------------------------------------
    key    0      1      2      3      4      5      6      7      8      9
   PRES   HGHT   TEMP   DWPT   RELH   MIXR   DRCT   SKNT   THTA   THTE   THTV
    hPa     m      C      C      %    g/kg    deg   knot     K      K      K
-----------------------------------------------------------------------------
*/

function drawSounding(data){
    console.log(data);
    drawTempLine(data);
    drawDwptLine(data);
}

function drawTempLine(data){
    var tempdata = [];
    var keys = Object.keys(data.levels);
    for (var key of keys){
        var d = data.levels[key];
        tempdata.push({
            pres: +key,
            temp: +d[1],
        });
    }
    
    var templine = d3.line()
        .x(function(d) { return x(d.temp); })
        .y(function(d) { return y(d.pres); });

    var templines = lineg.append("path")
        .datum(tempdata)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", templine);
}

function drawDwptLine(data){
    var dwptdata = [];
    var keys = Object.keys(data.levels);
    for (var key of keys){
        var d = data.levels[key];
        if (d[2]){
            dwptdata.push({
                pres: +key,
                dwpt: +d[2]
            });
        }
    }

    var dwptline = d3.line()
        .x(function(d) { return x(d.dwpt); })
        .y(function(d) { return y(d.pres); });

    var dwptlines = lineg.append("path")
        .datum(dwptdata)
        .attr("fill", "none")
        .attr("stroke", "seagreen")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", dwptline);
}


