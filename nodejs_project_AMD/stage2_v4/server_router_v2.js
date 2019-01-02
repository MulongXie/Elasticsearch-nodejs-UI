// *** 12/24/2018 ***
// *** version 1 ***
// Show the amount of keywords appearing in each logs (if > 0)

// *** 12/26/2018 ***
// *** version 2 ***
// Show up to 5 results for each log files

function router() {

    // *** initialize ***
    var express = require('express');
    var bodyParser = require('body-parser');
    var fs = require('fs');
    var es = require('./server_searchengine_v2');

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
        res.sendfile(__dirname + '/public/index_v1.html');
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

                var hits = result.hits.hits;
                var count_folder = result.aggregations.count_folder.buckets;

                // display the overall count
                var disp_count = "<table id='display_count' border='0' align='center'>";
                disp_count += "<tr><th>Log Folder</th><th>Log Name</th><th>Results Amount</th></tr>";
                for (var j = 0; j < count_folder.length; j++){
                    var count_log = count_folder[j].count_log.buckets;
                    disp_count += "<tr><td align='center' rowspan='" + count_log.length + "'>" + count_folder[j].key + "</td>";

                    disp_count += "<td align='center'><a href='http://localhost:8888/download?file=" + count_folder[j].key + "/" + count_log[0].key + "'>" + count_log[0].key + "</td>";
                    disp_count += "<td align='center'>" + count_log[0].doc_count + "</td></tr>";
                    for (var k = 1; k < count_log.length; k++){
                        disp_count += "<td align='center'><a href='http://localhost:8888/download?file=" + count_folder[j].key + "/" + count_log[k].key + "'>" + count_log[k].key + "</td>";
                        disp_count += "<td align='center'>" + count_log[k].doc_count + "</td></tr>";
                    }
                }
                disp_count += "</table><br>";

                // display the detailed result
                var used_log = new Array();  // record the logs that display more than limit times
                var disp_time_limit = 4;
                var disp_time = 0;
                var disp_number = 1;
                var disp_content = "<table id=\"display_content\" border=\"0\" align=\"center\">";
                disp_content += "<tr><th>Number</th><th>Log Folder</th><th>Log Name</th><th>Log Date</th><th>Log Time</th><th>Message</th></tr>";
                for(var i = 0; i < hits.length; i++){
                    var log_folder = hits[i]._source.log_folder;

                    // limit the time of display for each log
                    var log_name = hits[i]._source.log_name;
                    // skip the used names
                    if (used_log.indexOf(log_name) != -1){continue;}
                    if (disp_time >= disp_time_limit){
                        disp_time = 0;
                        used_log.push(log_name);
                        continue;
                    }
                    disp_time ++;

                    if (hits[i]._source.log_content){
                        var log_content =  hits[i]._source.log_content.replace(/\</g,'\[').replace(/\>/g,'\]');
                    }
                    else{
                        var log_content =  hits[i]._source.message.replace(/\</g,'\[').replace(/\>/g,'\]');
                    }
                    // highlight keywords
                    var keyreg = new RegExp(keycontent, 'ig');
                    log_content = log_content.replace(keyreg, '<mark>' + keycontent + '</mark>');

                    disp_content += "<tr><td align='center'>" + disp_number + "</td>";
                    disp_content += "<td align='center'>" + log_folder + "</td>";
                    disp_content += "<td align='center'><a href='http://localhost:8888/download?file=" + log_folder + "/" + log_name + "'>" + log_name + "</a></td>";
                    disp_content += "<td align='center'>" + hits[i]._source.log_date + "</td>";
                    disp_content += "<td align='center'>" + hits[i]._source.log_time + "</td>";
                    disp_content += "<td><pre>" + log_content + "</pre></td></tr>";

                    disp_number ++;
                }
                disp_content += "</table>";

                var disp = disp_count + disp_content;
                disp += "<p style='background-color: #00B7FF '>Download Logs to View More Details</p>"

                res.setHeader('Content-Type', 'text/html');
                res.end(disp);
            }
            else{
                res.end("<p align='center'>No related result found by given keyword in target folder: " + search['folder'] + '/' + search['keyword'] + "</p>");
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