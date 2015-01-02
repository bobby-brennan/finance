
var mData = [];
var mMinima = [];
var mMaxima = [];
var mInfoDate;
var mFit = 3;

var margin = {top: 50, right: 50, bottom: 50, left: 50},
    width = 1200 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

var parseDate = d3.time.format("%m/%d/%Y").parse;

var x = d3.time.scale()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .tickFormat(d3.time.format("%m/%d"))
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var optionLine = d3.svg.line()
    .x(function(d) { return x(d.expdate); })
    .y(function(d) { return y(getYValue(d)); });

var initSvg = function() {
  var svg = d3.select("#chart").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Price ($)");

  return svg;
}

var svg = initSvg();
var mPutsByStrike = {};
var mCallsByStrike = {};


var render = function(data) {
  mData = data;
  mData = mData.filter(function(d) { return d.expdate > parseDate($('#startDate').val()) && d.expdate < parseDate($('#endDate').val()) });
  mData = mData.filter(function(d) { return d['Call/Put'] == 'Call' });
  console.log('got data:' + JSON.stringify(data[0]))
  //mData = mData.filter(function(d) { return d['Call/Put'] == 'Put' && d.strike > 525 });
  x.domain(d3.extent(mData, function(d) { return d.expdate; }));
  y.domain(d3.extent(mData, getYValue))

  d3.selectAll('.path-marker').remove();
  d3.selectAll('.strike-label').remove();
  d3.selectAll("path.call").remove();
  d3.selectAll("path.put").remove();
  mPutsByStrike = {};
  mCallsByStrike = {};
  mData.forEach(function(d) {
    var byStrike = d['Call/Put'] == 'Call' ? mCallsByStrike : mPutsByStrike;
    if (!byStrike[d.strike]) {
      byStrike[d.strike] = [];
    }
    byStrike[d.strike].push(d);
  });

  addStrikeLines(mCallsByStrike, 'call');
  addStrikeLines(mPutsByStrike, 'put');
  addMouseMarker();

  var yAxisElem = svg.select(".y.axis");
  yAxisElem.selectAll('text').remove();
  yAxisElem.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Price ($)");
  yAxisElem.call(yAxis);

  xAxisElem = svg.select('.x.axis');
  var ticks = mData.map(function(d) {return d.expdate});
  xAxis.tickValues(ticks);
  xAxisElem.call(xAxis)
        .selectAll("text")  
            .style("text-anchor", "end")
            .attr("dy", "-.5em")
            .attr("dx", "-1em")
            .attr("transform", function(d) {
                return "rotate(-90)" 
            });
}

var addMouseMarker = function() {
  d3.selectAll('.overlay').remove();
  d3.selectAll('.focus').remove();

  var foci = [];
  for (var strike in mCallsByStrike) {
    var focus = svg.append("g")
        .attr("class", "focus")
        .attr('data-strike', strike)
        .style("display", "none");

    focus.append("circle")
        .attr("r", 4.5);

    focus.append("text")
        .attr("x", 9)
        .attr("dy", ".35em");
    foci.push(focus);
  }

  svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .on("mouseover", function() { foci.forEach(
        function(focus) { focus.style("display", null); }
      )})
      .on("mouseout", function() { foci.forEach(
        function(focus) {focus.style("display", "none"); }
      )})
      .on("mousemove", mousemove);

  function mousemove() {
    var x0 = x.invert(d3.mouse(this)[0]);
    var selected = {};
    var minDiff = -1;
    mData.forEach(function(d) {
      var diff = Math.abs(d.expdate.getTime() - x0.getTime());
      if (minDiff == -1 || diff < minDiff) {
        selected = {};
        selected[d.strike] = d;
        minDiff = diff;
      } else if (diff === minDiff) {
        selected[d.strike] = d;
      }
    });
    foci.forEach(function(focus) {
      var strike = focus.attr('data-strike');
      var data = mCallsByStrike[strike];
      var d = selected[strike];
      if (d) {
        focus.style("display", null);
        focus.attr("transform", "translate(" + x(d.expdate) + "," + y(getYValue(d)) + ")");
        focus.select("text").text(getYValue(d));
      } else {
        focus.style("display", 'none');
      }
    })
  }
}


var addStrikeLines = function(byStrike, type) {
  var ramp=d3.scale.linear().domain(d3.extent(mData, getColorValue)).range(["white","green"]);
  var strikes = Object.keys(byStrike);
  for (var i = 0; i < strikes.length; ++i) {
    var pathData = byStrike[strikes[i]];
    svg.append('path')
      .datum(pathData)
      .attr('class', type + ' option-line')
      .attr('d', optionLine)
      .attr('stroke', '#00FF00')//ramp(+strikes[i]))
    var lastDatumDate = d3.max(pathData, function(d) {return d.expdate});
    var lastDatum;
    pathData.forEach(function(d) {
      if (d.expdate === lastDatumDate) {
        lastDatum = d;
      }
      svg.append("circle")
         .attr('class', type + ' path-marker')
         .attr('r', 3)
         .attr('transform', 'translate(' + x(d.expdate) + ',' + y(getYValue(d)) + ')')
         .attr('fill', ramp(getColorValue(d)))
    });
    svg.append("text")
      .attr("transform", "translate(" + x(lastDatum.expdate) + "," + y(getYValue(lastDatum)) + ")")
      .attr("dy", "1px")
      .attr("dx", "1em")
      .attr("text-anchor", "start")
      .attr('class', type + ' strike-label')
      .text(lastDatum.strike);
  }
}

var getYValue = function(d) {
  return d[$('#yValue').val()];
}

var getColorValue = function(d) {
  return d.Price;
}

var getValueRatio = function(d) {
  return getBreakEvenPrice(d) / d.strike;
}

var getVega = function(d) {
  return d.Price;
}

var getBreakEvenPrice = function(d) {
  var mult = d['Call/Put'] === 'Call' ? 1 : -1;
  var ret = mult * d.Price + d.strike;
  return ret;
}

$(document).ready(function() {
  CBOE.loadOptionsData('goog', render);
  $('#ticker').on('change', function() {
    CBOE.loadOptionsData($('#ticker').val(), render);
  });
  var reloadAll = function() {
    CBOE.loadOptionsData($('#ticker').val(), render);
  };

  $('#ticker').val('goog');
  $('#startDate').val('01/01/2015');
  $('#endDate').val('03/01/2015');
  $('#yValue').val('Price')

  $('#startDate').on('change', reloadAll);
  $('#endDate').on('change', reloadAll);
  $('#yValue').on('change', reloadAll);
  $('#infoDate').on('change', function() {
    mInfoDate = $('#infoDate').val();
    if (mInfoDate) mInfoDate = parseDate(mInfoDate);
    render();
  });
  $('#fit').on('change', function() {
    mFit = +$('#fit').val();
    render(); 
  });
});

