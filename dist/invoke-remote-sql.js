
function testRemoteSql() {
  const t1 = [["Name", "Id"], ["A", 1], ["B", 2], ["C", 3], ["D", 4]]
  const t2 = [["Id", "City"], [1, "Mumbai"], [2, "Bangalore"], [3, "Pune"], [4, "Mumbai"]]
  const query = "SELECT * from t1 JOIN t2 ON t1.id == t2.id WHERE city LIKE '%$1%'"

  out = REMOTE_SQL_V2(query, 2, t1, t2, 'Mum')
}

const BASE_URL = "https://py-utils-sononehouse.fly.dev"

function sanitizeTable(tableData){
  const dateType = typeof(new Date())

  let breakIndex = -1
  // sanitize date inside data
  for (var i=0; i< tableData.length; i++) {
    const row = tableData[i]
    for (var j=0; j < row.length; j++) {
      if (typeof(row[j]) == dateType) {
        row[j] = Utilities.formatDate(row[j], 'Asia/Kolkata', "YYYY-MM-dd");
      }
    }

    if (row[0] == ''){
      // empty first column, we break and break array till this index
      breakIndex = i
      break
    }
  }

  if (breakIndex >= 0){
    tableData.length = breakIndex
  }
  else {
    return tableData
  }
}

/**
 * @customfunction
 * 
 */
function testDebug(tableData) {
  return typeof(tableData[tableData.length-1][0])
}

/**
 * Remote SQL query execution
 * 
 * @param {A1:C10} table Table data
 * @param {"select * from mytable"} query SQL query string
 * @return {Table} Output Table.
 * @customfunction
 * 
 * e.g
 * =REMOTE_SQL(<students>, "SELECT COUNT(*) from mytable")
 * =REMOTE_SQL(<students>, "SELECT COUNT(*) from mytable WHERE date > '$1'", "2023-01-05")
 * =REMOTE_SQL(<students>, A1, B1, B2) // A1 contains the sql query, B1 & B2 are arguments $1 & $2 respectively
 * 
 */
function REMOTE_SQL(tableData, query) {
  const URL = `${BASE_URL}/api/sql/`

  // sanitize date inside data
  sanitizeTable(tableData)

  const args = Array.from(arguments);
  const sqlVariables = args.slice(2) // <table>, <query>, <arg1>, <arg2>, ...

  // sanitize date inside arguments
  sanitizeTable([sqlVariables])

  var finalQuery = query
  // replace sqlVariables in the query
  for (var i=0; i<sqlVariables.length; i++) {
    const varNum = i+1
    finalQuery = finalQuery.replace("$" + varNum, sqlVariables[i])
  }

  const requestBody = {
    tableData: tableData,
    query: finalQuery
  }
  // console.log(requestBody)

  var response = UrlFetchApp.fetch(URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(requestBody)
  });
  var result = JSON.parse(response.getContentText());
  const outTable = result.outTable
  console.log(outTable)
  return outTable
}


/**
 * Remote SQL query execution
 * 
 * @param {"select * from mytable"} query SQL query string
 * @param {2} numTables Number of input tables
 * @param {A1:C10} table1 Table data
 * @param {Sheet2!A1:D5} table2 Table data
 * @param {M10} arg1 Argument $1
 * @param {10} arg2 Argument $2
 * @return {Table} Output Table.
 * @customfunction
 * 
 * e.g
 * =REMOTE_SQL_V2("SELECT COUNT(*) from mytable", 1, <students>)
 * =REMOTE_SQL_V2("SELECT COUNT(*) from mytable WHERE date > '$1'", 1, <students>, "2023-01-05")
 * =REMOTE_SQL_V2(A1, 1, <students>, B1, B2) // A1 contains the sql query, B1 & B2 are arguments $1 & $2 respectively
 * 
 */
function REMOTE_SQL_V2(query, numTable, table1, table2, arg1, arg2) {
  const URL = `${BASE_URL}/api/sql-v2/`

  const args = Array.from(arguments);

  const tables = args.slice(2, 2+numTable)

  for (table of tables) {
    sanitizeTable(table)
  }

  const sqlArgs = args.slice(2+numTable) // <table>, <query>, <arg1>, <arg2>, ...
  // sanitize date inside arguments
  sanitizeTable([sqlArgs])

  var finalQuery = query
  // replace sqlVariables in the query
  for (var i=0; i<sqlArgs.length; i++) {
    const varNum = i+1
    finalQuery = finalQuery.replace("$" + varNum, sqlArgs[i])
  }

  const requestBody = {
    tables: tables,
    query: finalQuery
  }
  // console.log(requestBody)

  var response = UrlFetchApp.fetch(URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(requestBody)
  });
  var result = JSON.parse(response.getContentText());
  const outTable = result.outTable
  console.log(outTable)
  return outTable
}