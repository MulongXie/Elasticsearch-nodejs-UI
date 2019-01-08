// *** 12/24/2018 ***
// *** version 1 ***
// Add aggregation functionality to count the keyword in each logs
// Find the relative folder for each logs and show in the overview table

// *** 12/26/2018 ***
// *** version 2 ***
// Show up to 5 results for each match logs in the display table

// *** 12/27/2018 ***
// *** version 3 ***
// Add visualization functionality

// *** 12/27/2018 ***
// *** version 4 ***
// Add show all functionality

// *** 1/3/2019 ***
// *** version 5 ***
// Show all for both database and txt files
// Show detail for both database and txt files in the same page

function queryFunc(keyword, flag, folder=false) {

    var index = "logstash-db_log-2019.1.3";  //'logstash-db-2018.12.31','logstash-logs-2018.12.26'，"logstash-db_log-2019.1.3"
    var results_number = 100;

    switch (flag) {
        // 1. search in text data only
        // search in given text folder
        case 1:
            return{
                index: index,
                type: 'doc',
                size: results_number,
                body:{
                    query:{
                        bool:{
                            must:[
                                {match:{"type":"txt"}},
                                {match:{"message": keyword}},
                                {match:{"log_folder": folder}}
                            ]
                        }
                    },
                    aggs: {
                        type: {
                            terms: {
                                "field": "type.keyword"
                            },
                            aggs: {
                                folder: {
                                    terms: {
                                        "field": "log_folder.keyword"
                                    },
                                    aggs: {
                                        log: {
                                            terms: {
                                                "field": "log_name.keyword"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    _source:["log_time", "log_date","log_name","message","log_folder","type"]
                }
            };

        // 2. search in all database and files
        case 2:
            return{
                index: index,
                type: 'doc',
                size: results_number,
                body:{
                    query:{
                        bool:{
                            should:[
                                //{term:{db_message:{"value":keyword}}},  // search exact string in database
                                {match:{"db_message":keyword}},
                                {match:{"message":keyword}}  // match the similar string in files
                            ]
                        }
                    },
                    aggs: {
                        type: {
                            terms: {
                                "field": "type.keyword"
                            },
                            aggs: {
                                folder: {
                                    terms: {
                                        "field": "log_folder.keyword"
                                    },
                                    aggs: {
                                        log: {
                                            terms: {
                                                "field": "log_name.keyword"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            };

        // 3. search in both folder and database
        // show all
        case 3:
            return {
                index: index,
                type: 'doc',
                size: results_number,
                body: {
                    aggs: {
                        type: {
                            terms: {
                                "field": "type.keyword"
                            },
                            aggs: {
                                folder: {
                                    terms: {
                                        "field": "log_folder.keyword"
                                    },
                                    aggs: {
                                        log: {
                                            terms: {
                                                "field": "log_name.keyword"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            };
    }
}


function elasticSearch(search, sendBack)
{
    // ****** initialize ******
    var elasticsearch = require('elasticsearch');
    var fs = require('fs');

    var folder = search['folder'];
    var keyword = search['keyword'];
    var show_all = search['show_all'];
    var result = false;
    var query;
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
    // show overview
    if(show_all){
        query = queryFunc('', 3);
    }
    // search in all txt files and database
    else if(folder === 'All') {
        query = queryFunc(keyword, 2);
    }
    // search in given folder of txt files
    else{
        query = queryFunc(keyword, 1, folder);
    }
    client.search(query).then(function (res){
        // get search resultj
        var total = res.hits.total;
        console.log("total: " + total);
        result = res.hits.hits;

        if (result.length > 0){
            // write into local file
            result = res;

            fs.writeFile(__dirname + '/output/search.json', JSON.stringify(result), function (err) {
                if(err){return console.log(err);}
                console.log('search result successfully save into ' + __dirname + '/output/search.json \n');
            });
        }
        else {
            result = false;
            console.log('No result found by given keyword');
        }

        // send back the entire result to the router
        // and then display
        sendBack(result);

    }, function (err) {
        console.error(err);
    });
}

exports.elasticSearch = elasticSearch;
