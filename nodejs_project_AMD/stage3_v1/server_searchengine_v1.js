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

function queryFunc(keyword, flag, folder=false) {

    var index = "logstash-db_log-2019.1.2";  //'logstash-db-2018.12.31','logstash-logs-2018.12.26'
    var results_number = 20;

    switch (flag) {
        // 1. search in text data only
        // search in all text folders
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
                                {match:{"message": keyword}}
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
                    _source:["log_time","log_date","log_name","message","log_folder","type"]
                }
            };
        // search in given text folder
        case 2:
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
                    _source:["log_time", "log_date","log_name","message","log_folder","type"]
                }
            };

        // 2. search in database only
        // search in all database
        case 3:
            return{
                index: index,
                type: 'doc',
                size: results_number,
                body: {
                    query:{
                        multi_match:{
                            "query": keyword,
                            "fields": ["auditid","posted","drid","due","roleid","sequencenum","todoid","type","actionid","userid",
                                "created","firstname","security",
                                "email","active","name","lastname","modified","alias",
                                "viewoperation","viewassignedto"
                                ,"cfgclass","cfgoperation","cfglocation","vieworiginatedlow","viewstatus","viewcommitmentlow","viewcloselocation"
                            ]
                        }
                    },
                    aggs:{
                        database:{
                            terms:{
                                "field": "type.keyword"
                            }
                        }
                    }
                }
            };

        // 3. search in both folder and database
        // show all
        case 4:
            return {
                index: 'logstash-db_log-2019.1.2',
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
        case 5:
            return{
                index: 'logstash-db_log-2019.1.2',
                type: 'doc',
                size: results_number,
                body: {
                    query:{
                        multi_match:{
                            "query": 150298, //150298
                            "fields": ["message",
                                "auditid","posted","drid","due","roleid","sequencenum","todoid","type","actionid","userid",
                                "created","firstname","security","lastdr",
                                "email","active","name","lastname","modified","alias",
                                "viewoperation","viewassignedto"
                                ,"cfgclass","cfgoperation","cfglocation","vieworiginatedlow","viewstatus","viewcommitmentlow","viewcloselocation"
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
    if(show_all){
        query = queryFunc('', 4);
    }
    else if(folder === 'All') {
        query = queryFunc(keyword, 5);
    }
    else{
        query = queryFunc(keyword, 2, folder);
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
