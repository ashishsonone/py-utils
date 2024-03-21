# Run
uvicorn main:app --reload

# Copy
DEST='ubuntu@sonone-cloud:~/APPS/PY-UTILS/'
scp main.py $DEST

# dependences
pip install fastapi
pip install "uvicorn[standard]"
pip install duckdb


# example curl
```bash
curl --location "https://$HOST/api/sql" \
--header 'Content-Type: application/json' \
--data '{
    "tableData" : [
  [
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
  ]
],
    "query" : "SELECT color, count(*) as num_ducks from mytable group by color"
}'
```

# remote sql google sheet function
```js
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
 */
function REMOTE_SQL(tableData, query) {
  const URL = "https://$HOST/api/sql"

  const dateType = typeof(new Date())
  for (var i=0; i< tableData.length; i++) {
    const row = tableData[i]
    for (var j=0; j < row.length; j++) {
      if (typeof(row[j]) == dateType) {
        row[j] = Utilities.formatDate(row[j], 'Asia/Kolkata', "YYYY-MM-dd");
      }
    }
  }

  var response = UrlFetchApp.fetch(URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({tableData, query})
  });
  var result = JSON.parse(response.getContentText());
  const outTable = result.outTable
  console.log(outTable)
  return outTable
}
```

# service

```bash
sudo systemctl enable py-utils.service
sudo systemctl restart py-utils


# cat /etc/systemd/system/py-utils.service
[Unit]
Description=Py Utils Service
After=network.target
StartLimitIntervalSec=0

[Service]
WorkingDirectory=/home/ubuntu/APPS/PY-UTILS/
Environment=PORT=8585
Type=simple
Restart=always
RestartSec=5
User=ubuntu
ExecStart=/home/ubuntu/miniconda3/bin//uvicorn --port 8585 main:app

[Install]
WantedBy=multi-user.target

```