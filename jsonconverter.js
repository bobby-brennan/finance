var Converter=require("csvtojson").core.Converter;
var fs=require("fs");
var Pretty = require('prettyjson').render;
var Glob = require('glob');

Glob('res/data/*.csv', function (err, files) {
  if (err) throw err;
  files.forEach(function(file) {
    console.log('file:' + file);
    var fileStream=fs.createReadStream(file);
    //new converter instance
    var csvConverter=new Converter({constructResult:true});

    //end_parsed will be emitted once parsing finished
    csvConverter.on("end_parsed",function(jsonObj){
       var outFile = file.replace('.csv', '.json');
       console.log('out:' + outFile);
       fs.writeFileSync(outFile, JSON.stringify(jsonObj));
    });
    fileStream.pipe(csvConverter);
  });
})
