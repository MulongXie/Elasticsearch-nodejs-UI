// *** 12/24/2018 ***
// *** version 1 ***
// Add aggregation functionality to count the keyword in each logs
// Find the relative folder for each logs and show in the overview table


function queryFunc(keyword, flag, folder=false) {
    switch (flag) {
        // 1.normal searching by keyword and folder
        case 1:
            return {
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
            };
        case 2:
            return {
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
            };

        // 2.group by log names and count the keywords in matched logs
        case 3:
            return {
                index: 'logstash-logs-2018.12.26',
                type: 'doc',
                size: 10,
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
                    aggs:{
                        count_log:{
                            terms:{
                                "field": "log_name.keyword"
                            }
                        }
                    },
                    _source:["log_time", "log_date","log_name","message","log_folder"]
                }
            };
        case 4:
            return {
                index: 'logstash-logs-2018.12.26',
                type: 'doc',
                size: 10,
                body:{
                    query:{
                        bool:{
                            must:[
                                {match:{"message": keyword}},
                                {match:{"log_folder": folder}}
                            ]
                        }
                    },
                    aggs:{
                        count_log:{
                            terms:{
                                "field": "log_name.keyword"
                            }
                        }
                    },
                    _source:["log_time", "log_date","log_name","message","log_folder"]
                }
            };

        // 3.Find the folder for each matched logs while counting
        case 5:
            return{
                index: 'logstash-logs-2018.12.26',
                type: 'doc',
                size: 10,
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
                    aggs:{
                        count_folder:{
                            terms:{
                                "field": "log_folder.keyword"
                            },
                            aggs:{
                                count_log:{
                                    terms:{
                                        "field": "log_name.keyword"
                                    }
                                }
                            }
                        }
                    },
                    _source:["log_time", "log_date","log_name","message","log_folder"]
                }
            };
        case 6:
            return{
                index: 'logstash-logs-2018.12.26',
                type: 'doc',
                size: 10,
                body:{
                    query:{
                        bool:{
                            must:[
                                {match:{"message": keyword}},
                                {match:{"log_folder": folder}}
                            ]
                        }
                    },
                    aggs:{
                        count_folder:{
                            terms:{
                                "field": "log_folder.keyword"
                            },
                            aggs:{
                                count_log:{
                                    terms:{
                                        "field": "log_name.keyword"
                                    }
                                }
                            }
                        }
                    },
                    _source:["log_time", "log_date","log_name","message","log_folder"]
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
    if(folder == 'All') {
        query = queryFunc(keyword, 5);
    }
    else{
        query = queryFunc(keyword, 6, folder);
    }
    client.search(query).then(function (res){
        // get search result
        var total = res.hits.total;
        console.log("total: " + total);
        result = res.hits.hits;
        console.log('number of matched result:' + result.length);

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
