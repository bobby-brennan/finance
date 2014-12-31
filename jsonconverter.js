var Converter=require("csvtojson").core.Converter;
var fs=require("fs");
var Pretty = require('prettyjson').render;

var csvFileName="./res/data/nflx_20141231_options.csv";
var fileStream=fs.createReadStream(csvFileName);
//new converter instance
var csvConverter=new Converter({constructResult:true});

//end_parsed will be emitted once parsing finished
csvConverter.on("end_parsed",function(jsonObj){
   fs.writeFileSync('res/data/nflx_20141231_options.json', JSON.stringify(jsonObj));
});

//read from file
fileStream.pipe(csvConverter);

