
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
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var pointLine = d3.svg.line()
    .x(function(d) { return x(d.x); })
    .y(function(d) { return y(d.y); });

var profitLine = d3.svg.line()
    .x(function(d) {return x(d.stockPrice)})
    .y(function(d) {return y(getProfit100(d.option, d.stockPrice))})

var getProfit100 = function (option, price) {
  return getProfit(option, price, 100);
}

var getProfit = function(option, stockPrice, costBasis) {
  if (option.strike >= stockPrice) {
    return -costBasis;
  }
  return (stockPrice - option.strike) * (costBasis / option.Price);
}

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


var addMouseSelect = function() {
  function mousemove() {
    var x0 = x.invert(d3.mouse(this)[0]);
    var selected = null;
    var minDiff = -1;
    mData.forEach(function(d) {
      var diff = Math.abs(d.strike - x0);
      if (!selected || diff < minDiff) {
        selected = d;
        minDiff = diff;
      }
    });

    console.log('selected:' + selected.strike);
    $('#selected').html('Strike:' + selected.strike + '<br>Price:' + selected.Price);
  }

  svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .on("mousemove", mousemove);
}

var svg = initSvg();
addMouseSelect();

var render = function(data) {
  mData = data;
  mData = mData.filter(function(d) { return d['Call/Put'] == 'Call' });

  xDom = d3.extent(mData, function(d) { return d.strike; });
  x.domain(xDom);
  y.domain([-200, 500]);

  var selExpDate = +$('#expdate').val();
  console.log('exp date:' + selExpDate);
  mData = mData.filter(function(d) { console.log('exp:' + +d.expdate); return +d.expdate === selExpDate })

  var midStrikePrice = d3.median(mData, function(d) {return d.strike});

  console.log('data (strike filter):' + mData.length);

  d3.selectAll("path.option-line").remove();

  svg.append('path')
    .datum([{x: xDom[0], y:0}, {x: xDom[1], y: 0}])
    .attr('class', 'option-line FOOF')
    .attr('d', pointLine)
    .attr('strike', '#0000FF')

  mData.forEach(function(d) {
    console.log('price:' + d.Price);
    if (d.Price === 0) return
    var pathData = [{option: d, stockPrice: xDom[0]},
                    {option: d, stockPrice: d.strike},
                    {option: d, stockPrice: xDom[1]}];
    console.log("PATH:" + JSON.stringify(pathData))
    console.log('strike:' + d.strike);
    svg.append('path')
      .datum(pathData)
      .attr('class', 'option-line')
      .attr('d', profitLine)
      .attr('data-price', d.Price)
      .attr('stroke', '#00FF00')
  })

  var yAxisElem = svg.select(".y.axis");
  yAxisElem.call(yAxis);

  xAxisElem = svg.select('.x.axis');
  xAxisElem.call(xAxis)
        .selectAll("text")  
            .style("text-anchor", "end")
}

$(document).ready(function() {
  var reloadExpdates = function(data) {
    var expDates = d3.set(data.map(function(d) { return +d.expdate })).values();
    var expdateSelect = $('#expdate');
    expdateSelect.html('');
    expDates.forEach(function(d) {
      console.log('adding:' + d);
      expdateSelect.append('<option value="' + +d + '">' + new Date(+d) + '</option>');
    })
  }

  var reloadAll = function() {
    CBOE.loadOptionsData($('#ticker').val(), function(data) {
      reloadExpdates(data);
      render(data);
    });
  };

  var reloadForExpdate = function() {
    CBOE.loadOptionsData($('#ticker').val(), function(data) {
      render(data);
    });
  }

  $('#ticker').val('goog');
  $('#expdate').on('change', reloadForExpdate);
  $('#ticker').on('change', reloadAll);

  reloadAll();
});

