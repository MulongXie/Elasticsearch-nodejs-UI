
function elasticSearch(search, sendBack)
{
    // ****** initialize ******
    var elasticsearch = require('elasticsearch');
    var fs = require('fs');

    var folder = search['folder'];
    var keyword = search['keyword'];
    var result = false;
    var client = new elasticsearch.Client({
        host: 'localhost:9200',
        log: 'error'
    });
    client.ping({requestTimeout: 30000}, function (err) {
        if(err){
            console.log('ES error!');
            console.error(err);
        }
        else{
            console.log('ES work well');
        }
    });


    // ****** query ******
    var query;
    if(folder == 'All'){
        query = {
            index: 'logstash-logs-2018.12.26',
            type: 'doc',
            size: 20,
            body:{
                query:{
                    bool:{
                        must:{
                            match:{
                                "message": keyword
                            }
                        }
                    }
                },
                _source:["log_time", "log_date","log_name","message","log_folder"]
            }
        }
    }
    else{
        query = {
            index: 'logstash-logs-2018.12.26',
            type: 'doc',
            body:{
                query:{
                    bool:{
                        must:[
                            {match:{"message": keyword}},
                            {match:{"log_folder": folder}}
                        ]
                    }
                },
                _source:["log_time", "log_date","log_name","message","log_folder"]
            }
        }
    }
    client.search(query).then(function (res){
        // get search result
        var total = res.hits.total;
        console.log("total: " + total);
        result = res.hits.hits;
        console.log('number of matched result:' + result.length);

        if (result.length > 0){
            // write into local file
            fs.writeFile(__dirname + '/output/search.json', JSON.stringify(result), function (err) {
                if(err){return console.log(err);}
                console.log('search result successfully save into ' + __dirname + '/output/search.json \n');
            });
        }
        else {
            result = false;
            console.log('No result found by given keyword');
        }

        // send back the result to the router
        // and then display
        sendBack(result);

    }, function (err) {
        console.error(err);
    });
}

exports.elasticSearch = elasticSearch;
