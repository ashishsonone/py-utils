
function testRemoteSql() {
  const tableData = [[
    "id",
    "color",
    "firstName",
    "lastName",
    "gender"
  ],
  [
    "kA0KgL",
    "red",
    "Marty",
    "McFly",
    "male"
  ],
  [
    "dx3ngL",
    "teal",
    "Duckota",
    "Fanning",
    "female"
  ],
  [
    "FQ4dU1",
    "yellow",
    "Duck",
    "Norris",
    "male"
  ],
  [
    "JqS7ZZ",
    "red",
    "James",
    "Pond",
    "male"
  ],
  [
    "ZM5uJL",
    "black",
    "Darth",
    "Wader",
    "male"
  ]];

  const query = "SELECT COUNT(*) from mytable WHERE gender='$1'"

  out = REMOTE_SQL(tableData, query, 'male')
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
  const URL = "https://$HOST/api/sql"

  const dateType = typeof(new Date())

  // sanitize date inside data
  for (var i=0; i< tableData.length; i++) {
    const row = tableData[i]
    for (var j=0; j < row.length; j++) {
      if (typeof(row[j]) == dateType) {
        row[j] = Utilities.formatDate(row[j], 'Asia/Kolkata', "YYYY-MM-dd");
      }
    }
  }

  // sanitize date inside arguments
  const args = Array.from(arguments);
  const sqlVariables = args.slice(2) // <table>, <query>, <arg1>, <arg2>, ...

  for (var i=0; i< sqlVariables.length; i++) {
    if (typeof(sqlVariables[i]) == dateType) {
      sqlVariables[i] = Utilities.formatDate(sqlVariables[i], 'Asia/Kolkata', "YYYY-MM-dd");
    }
  }

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
  console.log(requestBody)

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