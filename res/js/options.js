
var mData = [];
var mMinima = [];
var mMaxima = [];
var mInfoDate;
var mFit = 3;

var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var parseDate = d3.time.format("%m/%d/%Y").parse;

var x = d3.time.scale()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");
/*
var line = d3.svg.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.close); });
*/
var adj = d3.svg.line()
    .x(function(d) { return x(d.expdate); })
    .y(function(d) { return y(d.Price + d.strike); });

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
/*
  svg.append("path")
      .datum(mData)
      .attr("class", "price")
      .attr("d", line);
*/
  svg.append("path")
      .datum(mData)
      .attr("class", "adj")
      .attr("d", adj);

  svg.append('path')
      .datum(mMinima)
      .attr('class', 'minima')
      .attr('d', adj);

  svg.append('path')
      .datum(mMaxima)
      .attr('class', 'maxima')
      .attr('d', adj);

  return svg;
}

var svg = initSvg();

var processData = function() {
    generateExtremes();
    calculateDists(mMaxima, mData, true);
    calculateDists(mMinima, mData, false);
    filterExtremesByDist(mMaxima, mFit);
    filterExtremesByDist(mMinima, mFit);
}

var generateExtremes = function() {
  mMinima = [];
  mMaxima = [];
  for (var i = 0; i < mData.length; ++i) {
    if (mInfoDate && mData[i].date.getTime() > mInfoDate.getTime()) {
      console.log('skip:' + mData[i].date);
      continue;
    }
    var leftMin = i == 0 || mData[i-1].adjclose >= mData[i].adjclose;
    var rightMin = i == mData.length - 1 || mData[i+1].adjclose > mData[i].adjclose;
    var leftMax = i == 0 || mData[i-1].adjclose <= mData[i].adjclose;
    var rightMax = (i == mData.length - 1) || (mData[i+1].adjclose < mData[i].adjclose);
    if (leftMin && rightMin) {
      mMinima.push(mData[i]);
    } else if (leftMax && rightMax) {
      mMaxima.push(mData[i]);
    }
  }
  console.log('minima:' + mMinima.length + '   maxima:' + mMaxima.length);
}

var calculateDists = function(extremes, data, isMax) {
  for (var i = 0; i < extremes.length; ++i) {
    var val = extremes[i].adjclose;
    for (var j = 0; j < data.length; ++j) {
      if (i == j) {continue}
      var valid = isMax ? val < data[j].adjclose : val > data[j].adjclose;
      var dist = Math.abs(extremes[i].date.getTime() - data[j].date.getTime());
      if(valid && (!extremes[i].dist || dist < extremes[i].dist)) {
        extremes[i].dist = dist;
        extremes[i].distDate = data[j].date;
        extremes[i].distPrice = data[j].adjclose;
      }
    }
  }
}

var filterExtremesByDist = function(extremes, num) {
  extremes.sort(function(a, b) {
    if (!a.dist && !b.dist) return b.date - a.date;
    if (!a.dist) return -1;
    if (!b.dist) return 1;
    return b.dist - a.dist;
  });

  extremes.splice(num);

  extremes.sort(function(a, b) {
    return a.date - b.date;
  });
  console.log('filtered:' + JSON.stringify(extremes));
}

var render = function(data) {
  mData = data;
  x.domain(d3.extent(mData, function(d) { return d.expdate; }));
  y.domain(d3.extent(mData, function(d) { return d.Price + d.strike}));

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
  xAxisElem.call(xAxis);
/*
  svg.select(".price")
      .datum(mData)
      .attr('d', line)
*/
  svg.select(".adj")
      .datum(mData)
      .attr('d', adj);

  svg.select('.minima')
      .datum(mMinima)
      .attr('d', adj);

  svg.select('.maxima')
      .datum(mMaxima)
      .attr('d', adj);
}

$(document).ready(function() {
  Quandl.loadOptionsData(null, render);
  $('#ticker').on('change', function() {
    Quandl.loadOptionsData(null, render);
  });
  var reloadAll = function() {
    Quandl.loadOptionsData(null, render);
  };
  $('#startDate').on('change', reloadAll);
  $('#endDate').on('change', reloadAll);
  $('#infoDate').on('change', function() {
    mInfoDate = $('#infoDate').val();
    if (mInfoDate) mInfoDate = parseDate(mInfoDate);
    processData();
    render();
  });
  $('#fit').on('change', function() {
    mFit = +$('#fit').val();
    processData();
    render(); 
  });
});

