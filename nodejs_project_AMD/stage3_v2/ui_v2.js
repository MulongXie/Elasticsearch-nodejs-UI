// *** 1/2/2019 ***
// UI module independent from router

// *** 1/3/2019 ***
// *** version 5 ***
// Show all for both database and txt files
// Show detail for both database and txt files in the same page

function disp_overview(result, draw_data){
    var type = result.aggregations.type.buckets;

    var overview = {};
    var overview_txt = "<table id='over_txt' border='0' align='center'><tr><th>Log Folder</th><th>Log Name</th><th>Log Results Amount</th><th>Folder Results Amount</th></tr>"; // table of txt
    var overview_db = "<table id='over_db' border='0' align='center'><tr><th>Database Name</th><th>Data Amount</th></tr>"; // table of db

    for (var i = 0; i < type.length; i++){

        // overview of txt files
        if (type[i].key === 'txt'){
            var count_folder = type[i].folder.buckets;
            for (var j = 0; j < count_folder.length; j++){
                var count_log = count_folder[j].log.buckets;

                overview_txt += "<tr><td align='center' rowspan='" + count_log.length + "'>" + count_folder[j].key + "</td>";
                overview_txt += "<td align='center'><a href='http://localhost:8888/download?file=" + count_folder[j].key + "/" + count_log[0].key + "'>" + count_log[0].key + "</td>";
                overview_txt += "<td align='center'>" + count_log[0].doc_count + "</td>";
                overview_txt += "<td align='center' rowspan='" + count_log.length + "'>" + count_folder[j].doc_count + "</td></tr>";
                draw_data [count_log[0].key] = count_log[0].doc_count; // restore for drawing
                for (var k = 1; k < count_log.length; k++){
                    overview_txt += "<td align='center'><a href='http://localhost:8888/download?file=" + count_folder[j].key + "/" + count_log[k].key + "'>" + count_log[k].key + "</td>";
                    overview_txt += "<td align='center'>" + count_log[k].doc_count + "</td></tr>";
                    draw_data [count_log[k].key] = count_log[k].doc_count;
                }

            }
            overview_txt += "</table><br>";
        }
        // overall of database
        else{
            overview_db += "<tr><td align='center'><b>" + type[i].key + "</b></td><td align='center'>" + type[i].doc_count + "</td>"
            draw_data ["DB_" + type[i].key] = type[i].doc_count;
        }
    }
    overview_db += "</table><br>";
    overview['txt'] = overview_txt;
    overview['db'] = overview_db;

    return overview;
}


function disp_txt(hit, keycontent, no_txt){

    var log_folder = hit._source.log_folder;
    var log_name = hit._source.log_name;
    var log_content;
    var disp_content = '';

    if (hit._source.log_content){
        log_content =  hit._source.log_content.replace(/\</g,'\[').replace(/\>/g,'\]');
    }
    else{
        log_content =  hit._source.message.replace(/\</g,'\[').replace(/\>/g,'\]');
    }
    // highlight keywords
    var keyreg = new RegExp(keycontent, 'ig');
    log_content = log_content.replace(keyreg, '<mark>' + keycontent + '</mark>');

    disp_content += "<tr><td align='center'>" + no_txt + "</td>";
    disp_content += "<td align='center'>" + log_folder + "</td>";
    disp_content += "<td align='center'><a href='http://localhost:8888/download?file=" + log_folder + "/" + log_name + "'>" + log_name + "</a></td>";
    disp_content += "<td align='center'>" + hit._source.log_date + "</td>";
    disp_content += "<td align='center'>" + hit._source.log_time + "</td>";
    disp_content += "<td><pre>" + log_content + "</pre></td></tr>";

    return disp_content;
}


function disp_db(hit, no_db){

    var disp_content = "<tr><td align='center'>" + no_db + "</td>";
    disp_content += "<td align='center'>" + hit._source.type + "</td>";
    disp_content += "<td align='center'>";
    for(var j in hit._source){
        disp_content += "<b>" + j + ':' + "</b>" + hit._source[j] + "<br>";
    }
    disp_content += "</td></tr>";

    return disp_content;
}


function disp_detail(result, keyword){
    var hits = result.hits.hits;
    var table_txt = "<table id='table_txt' border='0'><tr><th>Number</th><th>Log Folder</th><th>Log Name</th><th>Log Date</th><th>Log Time</th><th>Message</th></tr>";
    var table_db = "<table id='table_db' border='0'><tr><th>No.</th><th>Database</th><th>Content</th></tr>"
    var no_txt = 1;
    var no_db = 1;
    for(var i = 0; i < hits.length; i++){

        var disp_time_limit = 3;
        var used_log = [];  // record the logs that display more than limit time
        var disp_time = 0;
        if(hits[i]._source.type === 'txt'){
            // skip the used names
            var log_name = hits[i]._source.log_name;
            if (used_log.indexOf(log_name) !== -1){continue;}
            if (disp_time >= disp_time_limit) {
                disp_time = 0;
                used_log.push(log_name);
                continue;
            }
            disp_time ++;

            table_txt += disp_txt(hits[i], keyword, no_txt);
            no_txt += 1;
        }
        else{
            table_db += disp_db(hits[i], no_db);
            no_db += 1;
        }
    }
    table_txt += "</table>";
    table_db += "</table>";

    var detail_table = {};
    detail_table['db'] = table_db;
    detail_table['txt'] = table_txt;

    return detail_table;
}

exports.disp_overview = disp_overview;
exports.disp_detail = disp_detail;