# how to use in excel
```js
// v1 function
REMOTE_SQL(table, query, arg1, arg2)

// v2 function
REMOTE_SQL_V2(query, num_tables, table1, table2, arg1, arg2) // arg1 will replace $1, arg2 will replace $2 in the query string
REMOTE_SQL_V2(query, 2, t1, t2, 'Mum')

// simple example
// {students} is the data range i.e table data e.g A1:G10
=REMOTE_SQL({students}, "SELECT COUNT(*) from mytable")
=REMOTE_SQL({students}, "SELECT COUNT(*) from mytable WHERE date > '$1'", "2023-01-05")
=REMOTE_SQL({students}, A1, B1, B2) // A1 contains the sql query, B1 & B2 are arguments $1 & $2 respectively

// join example
// E26 contains the query = SELECT * from t1 JOIN t2 ON t1."Company ID" = t2.Company
// A20:C24 is first table (Name,	Company Id,	Age)
// E20:G23 is the second table (Company,	Location,	Rating)
// we want to join the 2 tables based on Company Id
=REMOTE_SQL_V2(E26, 2, A20:C24, E20:G23)

```

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
uvicorn main:app --port 8585 --reload

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
```bash
fly launch --now

fly scale show
fly scale count 1

fly deploy --strategy immediate
# rolling, immediate, canary, bluegreen

# logs
flyctl logs
```

# glcoud run commands
```bash
gcloud run deploy py-utils-api --source . --region asia-south1

#Building using Dockerfile and deploying container to Cloud Run service [py-utils-api] in project [ytapi-371521] region [asia-south1]

gcloud run services describe py-utils-api --region asia-south1

```

# prql
https://prql-lang.org/playground/
```prql
from tracks
select {
  tracks.name,
  a = s"RANDOM()::TEXT",
  now = s"LEN(RANDOM()::varchar)"
}
take 10
```

# TODO
- [x] Add support for multiple tables so you could do something like join
  - [ ] formula : `=REMOTE_SQL(query, num_table, t1, t2, t3, arg1, arg2, arg3)`
  - [ ] sql : `SELECT * FROM t1 JOIN t2 ON t1.Field1 = t2.Field2 WHERE name LIKE '%$1%'`

- [x] Lazy execution - Add support for stringified range ("A1:C10") instead of actual table ref (A1:C10) so that it doesn't recompute frequently when you're changing table content, but only when we want it
  - [x] formula : `LAZY_REMOTE_SQL_V2(A1, "SELECT COUNT(*) from mytable WHERE date='$1'", 1, "A1:C10", "O1")`
  - [x] support named ranges e.g "computed" - already works by default

- [x] Don't send empty rows to server api in appscript
  - [ ] trim the table if first column of any row is empty

- [x] Treat empty string as NULL when sending to server
  - [ ] replace '' => null before in request body

- [x] Proper error handling when showing in google sheet

- [x] Support PRQL (pipelined relational query language) support using "prql-python"

- [ ] Add tests
