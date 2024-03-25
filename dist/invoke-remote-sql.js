
function testRemoteSql() {
  const t1 = [["Name", "Id"], ["A", 1], ["B", 2], ["C", 3], ["D", 4]]
  const t2 = [["Id", "City"], [1, "Mumbai"], [2, "Bangalore"], [3, "Pune"], [4, "Mumbai"]]
  const query = "SELECT * from t1 JOIN t2 ON t1.id == t2.id WHERE city LIKE '%$1%'"

  // out = REMOTE_SQL_V2(query, 2, t1, t2, 'Mum')
  // LAZY_REMOTE_SQL_V2("32", "SELECT COUNT(*) from t1 WHERE date='$1'", 1, "OilV2!A1:C100", "OilV2!O2")
  LAZY_REMOTE_SQL_V2("1", "SELECT * from t1", 1, "Sheet4!A1:C10")
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
      else if (row[j] === '') {
        // consider it NULL
        row[j] = null
      }
    }

    if (row[0] == null){
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
 * @customfunction
 * 
 */
function testDebug(cell) {
  // range = range || "Sheet1!A1:C5"
  return JSON.stringify({t: typeof(cell), v: cell})
}

function getTableFromRange(rangeRef) {
  const table = SpreadsheetApp.getActiveSpreadsheet().getRange(rangeRef).getValues()
  return table
}

function getCellValue(cellRef) {
    const cellValue = SpreadsheetApp.getActiveSpreadsheet().getRange(cellRef).getValue()
    return cellValue
}

/**
 * Lazy Remote SQL query execution. It will recompute only when trigger cell value changes (first argument)
 * Avoids unnecessary calling of sql remote api
 * 
 * @param {C1} triggerCell ref to cell which will trigger recomputation
 * @param {"select * from mytable"} query SQL query string
 * @param {2} numTables Number of input tables
 * @param {"Sheet1A1:C10"} table1Notn table 1 range notation in string form e.g "Sheet1A1:C10"
 * @param {"G1:P20"} table1Notn table 2 range notation in string form e.g "G1:P20"
 * @param {"O1"} arg1Notn Argument $1 cell notation in string form e.g "O1"
 * @param {"O2"} arg2Notn Argument $1 cell notation in string form e.g "O2"
 * @return {Table} Output Table.
 * @customfunction
 * 
 * e.g
 * =LAZY_REMOTE_SQL_V2(A1, "SELECT COUNT(*) from mytable WHERE date='$1'", 1, "A1:C10", "O1") // O1 contains the date e.g "2023-01-05"
 * =LAZY_REMOTE_SQL_V2(A1, A2, 1, "B1:D10", "O1") // A1 contains trigger value, A2 contains query, O1 contains the date e.g "2023-01-05"
 */
function LAZY_REMOTE_SQL_V2(triggerCell, query, numTable, table1Notn, table2Notn, arg1Notn, arg2Notn) {
  const URL = `${BASE_URL}/api/sql-v2/`

  const args = Array.from(arguments);

  const tableRefList = args.slice(3, 3+numTable)
  const tables = []

  for (tableRef of tableRefList) {
    const table = getTableFromRange(tableRef)
    tables.push(table)

    sanitizeTable(table)
  }

  const sqlArgs = []
  const sqlArgRefList = args.slice(3+numTable)
  for (cellRef of sqlArgRefList) {
    const cellValue = getCellValue(cellRef)
    sqlArgs.push(cellValue)
  }

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
      payload: JSON.stringify(requestBody),
      // muteHttpExceptions: true
  });
  var result = JSON.parse(response.getContentText());
  const outTable = result.outTable
  // console.log(outTable)
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
  // console.log(outTable)
  return outTable
}