var url = "https://s3-ap-northeast-1.amazonaws.com/soundings/sounding-current.json.gz";

var width = 600, height = 600;

var margin = {top: 20, right: 30, bottom: 20, left: 30},
    w = 600 - margin.left - margin.right,
    h = 600 - margin.top - margin.bottom;

var basep = 1050,
    topp = 100;
    
var svg = d3.select("#emagram").append("svg")
    .attr("width", width)
    .attr("height", height);

var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
var backg = g.append("g"),
    lineg = g.append("g");

var x = d3.scaleLinear().range([0, w]).domain([-80, 45]),
    y = d3.scaleLog().range([0, h]).domain([topp, basep]);

// Meteorology Constants
// https://github.com/Unidata/MetPy/blob/master/metpy/constants.py
var Rd = 287;
var Lv = 2.501e+6;
var Cp_d = 1005;
var epsilon = 18.01528 / 28.9644;


plotBackground();

d3.json(url, function(data){
    plot(data['47778']);
});


function plotBackground(){
    plotAxis();
    clipping();
    plotDryAdiabats();
    plotMoistAdiabats();
    plotMixingLines();
    makeBarbTemplates();
}

function plotAxis(){
    // x: temp
    var xAxis = d3.axisBottom(x)
            .tickSize(-h).ticks(10);
    backg.append("g")
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

    backg.append("g").call(yAxis)
        .selectAll(".tick:not(:last-of-type) line").attr("stroke", "#ccc"); // grid lines
    backg.append("g").call(yAxis2);
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


function plotDryAdiabats(){
    var pp = d3.range(topp, basep+1, 10); // plot points
    var dryad = d3.range(-60, 200, 20);

    var dryline = d3.line()
        .x(function(d,i) { return x(potentialTemperature(d, pp[i])); })
        .y(function(d,i) { return y(pp[i]); });

    var linepoints = []; // dryad x pp matrix
    for (var t of dryad){
        linepoints.push(Array(pp.length).fill(t));
    }

    backg.selectAll(".dryline")
        .data(linepoints)
        .enter().append("path")
          .attr("fill", "none")
          .attr("stroke", "#F5B2B2")
          .attr("stroke-opacity", "0.5")
          .attr("d", dryline)
          .attr("clip-path", "url(#clipper)");
}

// ref. https://en.wikipedia.org/wiki/Potential_temperature
function potentialTemperature(t, p){
    return (273.15 + t) / Math.pow((1000 / p), 0.286) - 273.15;
}


function plotMoistAdiabats(){
    // equal interval moist and dry adiabats
    var moistad = [-50, -30, -13.5, 0, 10, 16.6, 22.2, 26.2, 29.5, 32.2, 34.7, 37.0];
    var linepoints = moistad.map(function(t){ return moistLapse(t); });

    var moistline = d3.line()
        .x(function(d) { return x(d[1]); })  // temp
        .y(function(d) { return y(d[0]); }); // pressure

    backg.selectAll(".moistline")
        .data(linepoints)
        .enter().append("path")
          .attr("fill", "none")
          .attr("stroke", "#A3BCE2")
          .attr("stroke-opacity", "0.5")
          .attr("d", moistline)
          .attr("clip-path", "url(#clipper)");
}

// integrate moist lapse ratio
// https://unidata.github.io/MetPy/latest/api/generated/metpy.calc.moist_lapse.html#metpy.calc.moist_lapse
function moistLapse(baseT){
    var lapse = [];
    var dt = 0;
    var dp = 10;

    // start point
    lapse.push([1000, baseT]);

    // 1000hPa -> basep(1050hPa)
    var t = baseT;
    for (var p = 1000 + dp; p <= basep; p += dp){
        var dt = moistLapseRatio(p, t);
        var temp = t + dt * dp;
        lapse.push([p, temp]);
        t = temp;
    }
    lapse = lapse.reverse();

    // 1000hPa -> topp(100hPa)
    t = baseT;
    for (var p = 1000 - dp; p >= topp; p -= dp){
        var dt = moistLapseRatio(p, t);
        var temp = t - dt * dp;
        lapse.push([p, temp]);
        t = temp;

        if (t < -80) break; // out of plot
    }
    return lapse;
}


function moistLapseRatio(p, t){
    var tk = t + 273.15;
    var rs = saturationMixingRatio(p, t);
    var frac = (Rd * tk + Lv * rs) /
                (Cp_d + (Lv * Lv * rs * epsilon / (Rd * tk * tk)));
    return frac / p;
}

function saturationMixingRatio(p, t){
    return mixingRatio(saturationVaporPressure(t), p);
}

function mixingRatio(part_pres, tot_pres){
    return 0.622 * part_pres / (tot_pres - part_pres);
}

function saturationVaporPressure(temp){
    return 6.112 * Math.exp(17.67 * temp / (temp + 243.5));
}


function plotMixingLines(){
    var pp = d3.range(500, basep+1, 10);
    var mixing = [0.001, 0.002, 0.004, 0.007, 0.01, 0.016, 0.024, 0.032];
    var linepoints = [];
    for (var m of mixing){
        linepoints.push(pp.map(function(p){ return [p, dewpoint(vaporPressure(p, m))]; }));
    }

    var mixingline = d3.line()
        .x(function(d) { return x(d[1]); })  // temp
        .y(function(d) { return y(d[0]); }); // pressure

    backg.selectAll(".mixingline")
        .data(linepoints)
        .enter().append("path")
          .attr("fill", "none")
          .attr("stroke", "#A5D4AD")
          .attr("stroke-opacity", "0.5")
          .attr("d", mixingline)
          .attr("clip-path", "url(#clipper)");
}


function dewpoint(e){
    var v = Math.log(e / 6.112);
    return 243.5 * v / (17.67 - v);
}

function vaporPressure(pres, mixing){
    return pres * mixing / (epsilon + mixing);
}


/*
sounding data
-----------------------------------------------------------------------------
  key    0      1      2      3      4      5      6      7      8      9
  PRES   HGHT   TEMP   DWPT   RELH   MIXR   DRCT   SKNT   THTA   THTE   THTV
  hPa     m      C      C      %     g/kg   deg    knot    K      K      K
-----------------------------------------------------------------------------
*/

function plot(data){
    console.log(data);
    plotTempLine(data);
    plotDwptLine(data);
    plotWindBarb(data);
}

function plotTempLine(data){
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
        .attr("stroke", "#E9546B")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 2)
        .attr("d", templine)
        .attr("clip-path", "url(#clipper)");
    
    initTooltip(tempdata, data.levels);
}

function plotDwptLine(data){
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
        .attr("stroke", "#00A95F")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 2)
        .attr("d", dwptline)
        .attr("clip-path", "url(#clipper)");
}

function plotWindBarb(data){
    var keys = [];
    var prev = 1000;
    var interval = 20;
    for (var k of Object.keys(data.levels)){
        if (keys.length == 0) keys.push(k); // surface

        if (prev - k > interval && prev % 50 != 0){
            keys.push(prev);
        }

        if (k % 50 == 0){
            keys.push(k);
            prev = k;

        }else if (prev - k > interval){
            prev = k;
        }
    }

    var winddata = [];
    for (var key of keys){
        var d = data.levels[key];
        if (key < topp) break;
        if (d[6]){
            winddata.push({
                pres: +key,
                dir: +d[5],
                speed: Math.round(d[6] / 5) * 5 
            });
        }
    }

    barbs = lineg.selectAll("barbs")
        .data(winddata).enter()
        .append("use")
    	.attr("xlink:href", function (d) { return "#barb"+d.speed; })
    	.attr("transform", function(d) { return "translate("+ w +","+ y(d.pres) +") rotate("+ (d.dir+180) +")"; });
}


function makeBarbTemplates() {
    var barbsize = 25;
    var speeds = d3.range(5, 205, 5);
    barbdef = svg.append('defs');
    speeds.forEach(function(d) {
    	var thisbarb = barbdef.append('g')
            .attr('id', 'barb'+d)
            .attr('class', 'windbarb');
    	
    	var flags = Math.floor(d/50);
        var pennants = Math.floor((d - flags*50)/10);
        var halfpennants = Math.floor((d - flags*50 - pennants*10)/5);
        var px = barbsize;
        	    
		// Draw wind barb stems
		thisbarb.append("line").attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", barbsize);
     
    	// Draw wind barb flags and pennants for each stem
	    for (i=0; i<flags; i++) {
     		thisbarb.append("polyline")
                .attr("points", "0,"+px+" -10,"+(px)+" 0,"+(px-4))
     		    .attr("class", "flag");
     		 px -= 5;
     	}
        if (flags > 0) px -= 2;
	    // Draw pennants on each barb
	    for (i=0; i<pennants; i++) {
    	    thisbarb.append("line")
     		    .attr("x1", 0)
     		    .attr("x2", -10)
     		    .attr("y1", px)
     		    .attr("y2", px+4)
     		 px -= 3;
     	}
     	// Draw half-pennants on each barb
        for (i=0; i<halfpennants; i++) {
    	    thisbarb.append("line")
     		    .attr("x1", 0)
     		    .attr("x2", -5)
     		    .attr("y1", px)
     		    .attr("y2", px+2)
     		px -= 3;
     	}
    });
}


function initTooltip(tempdata, levels){
    var bisectdata = tempdata.reverse();
    var bisect = d3.bisector(function(d){ return d.pres; }).left;

    var focus = g.append("g")
        .attr("class", "focus")
        .style("display", "none");

    focus.append("line")
        .attr("class", "y-hover-line")
        .attr("x1", 0)
        .attr("x2", w)
        .attr("stroke", "#999")
        .attr("opacity", 0.7);

    var focusY = focus.append("text")
        .attr("x", 4)
        .attr("dy", -2)
        .attr("text-anchor", "start");


    g.append("rect")
        .attr("width", w)
        .attr("height", h)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("mouseover", showTooltip)
        .on("mouseout", hideTooltip)
        .on("mousemove", mousemove);


    function showTooltip(){
        focus.style("display", null);
    }

    function hideTooltip(){
        focus.style("display", "none");
    }

    function mousemove(){
        var p = y.invert(d3.mouse(this)[1]); // get y:pressure of mouse pointer
        var i = bisect(bisectdata, p, 1, bisectdata.length - 1);
        var d0 = bisectdata[i - 1];
        var d1 = bisectdata[i];
        var d = (p - d0.pres > d1.pres - p) ? d1 : d0;
        var l = levels[d.pres + ".0"];
        console.log(d.pres, l);

        focus.attr("transform", "translate(0," + y(d.pres) + ")");
        focusY.text(d.pres + "hPa " + Math.round(l[0]/100)/10 + "km");
    }
}

