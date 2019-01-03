// *** 12/24/2018 ***
// *** version 1 ***
// Show the amount of keywords appearing in each logs (if > 0)

// *** 12/26/2018 ***
// *** version 2 ***
// Show up to 5 results for each log files

// *** 12/27/2018 ***
// *** version 3 ***
// Add visualization functionality

// *** 12/27/2018 ***
// *** version 4 ***
// Add show all functionality

// *** 1/3/2019 ***
// *** version 5 ***
// Split functions into UI module
// Show all for both database and txt files
// Show detail for both database and txt files

function router() {

    // *** initialize ***
    var express = require('express');
    var bodyParser = require('body-parser');
    var fs = require('fs');
    var es = require('./server_searchengine_v1');
    var ui = require('./ui');

    var app = express();
    var keycontent;  // the input keyword
    var folder;  // the input folder

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
            'keyword': req.query.keyword,
            'show_all': req.query.show_all
        };
        keycontent = search['keyword'];
        folder = search['folder'];
        console.log("\n\ninput folder: " + folder);
        console.log("Input keyword: " + keycontent);

        // search by given keywords
        es.elasticSearch(search, function (result) {
            var response = {};  // the final return response
            if(result){
                // return variables
                var disp = '';  // the table on website
                var draw_data = {};  // the data for drawing diagram
                // show all or show details
                if(search['show_all']){
                    disp = ui.disp_overview(result, draw_data);
                }
                else{
                    disp += ui.disp_detail(result, keycontent);
                }

                // 3. gather the results
                disp += "<p style='background-color: #00B7FF '>Download Logs to View More Details</p>";
                response['disp'] = disp;
                response['draw_data'] = draw_data;
                response['status'] = 1;
                res.setHeader('Content-Type', 'text/html');
                res.end(JSON.stringify(response));
            }
            else{
                response['disp'] = "<p align='center' style='font-weight: bolder'><b>No related result found by given keyword in target folder: " + search['folder'] + '/' + search['keyword'] + "</b></p>";
                response['status'] = -1;
                res.end(JSON.stringify(response));
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