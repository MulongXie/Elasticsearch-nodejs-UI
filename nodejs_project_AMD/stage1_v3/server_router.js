
function router() {

    // *** initialize ***
    var express = require('express');
    var bodyParser = require('body-parser');
    var fs = require('fs');
    var es = require('./server_searchengine');

    var app = express();
    var keycontent;
    var folder;
    var result = undefined;

    app.use(express.static('public'));
    app.use(express.static(__dirname));
    app.use(express.static('logs'));
    app.use(bodyParser.urlencoded({extended: false}));


    // *** router start ***
    app.get('/', function (req, res) {
        res.sendfile(__dirname + '/public/index.html');
    });

    app.get('/getkeyword', function (req, res) {
        // get keyword from request
        var search = {
            'folder': req.query.folder,
            'keyword': req.query.keyword
        };
        keycontent = search['keyword'];
        folder = search['folder'];
        console.log("\n\ninput folder: " + folder);
        console.log("Input keyword: " + keycontent);

        // search by given keywords
        es.elasticSearch(search, function (result) {
            if(result){
                var disp = "<tr><th>Number</th><th>Log Folder</th><th>Log Name</th><th>Log Date</th><th>Log Time</th><th>Message</th></tr>";
                for(var i = 0; i < result.length; i++){

                    var log_folder = result[i]._source.log_folder;
                    var log_name = result[i]._source.log_name;
                    var log_content =  result[i]._source.message.replace(/\</g,'\[').replace(/\>/g,'\]');
                    // highlight keywords
                    var keyreg = new RegExp(keycontent, 'g');
                    log_content = log_content.replace(keyreg, '<mark>' + keycontent + '</mark>');

                    disp += "<tr><td align='center'>" + (i + 1) + "</td>";
                    disp += "<td align='center'>" + log_folder + "</td>";
                    disp += "<td align='center'><a href='http://localhost:8888/download?file=" + log_folder + "/" + log_name + "'>" + log_name + "</a></td>";
                    disp += "<td align='center'>" + result[i]._source.log_date + "</td>";
                    disp += "<td align='center'>" + result[i]._source.log_time + "</td>";
                    disp += "<td><pre>" + log_content + "</pre></td></tr>";
                }

                res.setHeader('Content-Type', 'text/html');
                res.end(disp);
            }
            else{
                res.end('No related result found by given keyword in target folder: ' + search['folder'] + '/' + search['keyword']);
            }
        });
    });

    app.get('/download', function (req, res) {
        var file = __dirname + '\\logs\\' + req.query.file;
        console.log("Download " + file);
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': 'attachment; filename=' + req.query.file
        });
        fs.createReadStream(file).pipe(res);
    });


    // *** open port ***
    var server = app.listen(8888, function () {
        console.log('server created \n');
    });
}

exports.router = router;

router();