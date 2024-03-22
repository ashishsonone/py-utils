# dependences
```bash
conda create -n py-utils-api python=3.9
conda activate py-utils-api

pip install fastapi
pip install "uvicorn[standard]"
pip install duckdb


pip freeze > requirements.txt
pip install -r requirements.txt
```

# Run local development
uvicorn main:app --reload

# Copy
DEST='ubuntu@sonone-cloud:~/APPS/PY-UTILS/'
scp main.py $DEST

# docker build
```bash
docker build -t py-utils-api:latest .
docker run -it -p 8585:8080 py-utils-api

curl --location 'http://localhost:8585/api/sql/' \
--header 'Content-Type: application/json' \
--data '{
    "tableData" : [["Name"], ["A"], ["B"], ["C"], ["D"]],
    "query" : "SELECT * from mytable LIMIT 3"
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

# logs
```bash
# logs
journalctl -f -u py-utils.service
```

# setup as service

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

# fly commands
```
fly launch --now

fly scale show
fly scale count 1

fly deploy --strategy immediate
# rolling, immediate, canary, bluegreen
```

