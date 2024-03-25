from typing import Any, Dict, AnyStr, List, Union

from fastapi import FastAPI, HTTPException

from pydantic import BaseModel
import duckdb
import pandas as pd
import numpy
import prql_python as prql

app = FastAPI()

JSONObject = Dict[str, Any]

import os

DEBUG_ON = os.environ.get('DEBUG') == '1'

def debug(*args):
    if DEBUG_ON:
        print('DEBUG', *args)

@app.post("/api/sql/")
async def run_sql(body: JSONObject = None):
    with duckdb.connect() as con:
        try:
            tableData = body['tableData']
            # prin t(tableData[1])
            query = body['query']
            debug('query=', query)
            debug('head=', tableData[0:5])
            df = pd.DataFrame(tableData[1:], columns=tableData[0])
            con.register('mytable', df)

            out = con.query(query)
            # print(out)
            outDf = out.to_df().replace({numpy.nan: None})
            outTable = [outDf.columns.tolist()] + outDf.values.tolist()
            result = {
                'outTable' : outTable
            }
            return result
        except Exception as e:
            print(e)
            raise HTTPException(status_code=500, detail=repr(e))

@app.post("/api/sql-v2/")
async def run_sql(body: JSONObject = None):
    with duckdb.connect() as con:
        try:
            tables = body['tables']
            # prin t(tableData[1])
            query = body['query']
            use_prql = body.get('usePrql') == True

            debug('query=', query)
            debug('head=', tables[0][0:5])
            debug('use_prql=', use_prql)

            if use_prql:
                compile_options = prql.CompileOptions(target='sql.duckdb')
                query = prql.compile(query, compile_options)
                debug('compiled_query=', query)

            df_list = []
            for i in range(len(tables)):
                table = tables[i]
                df = pd.DataFrame(table[1:], columns=table[0])
                df_list.append(df)

            # register the table with duckdb connection
            # t1 => df_list[0]
            # t2 => df_list[1]
            # ...
            for i in range(len(df_list)):
                con.register(f"t{i+1}", df_list[i])

            out = con.query(query)
            debug(out)
            outDf = out.to_df().replace({numpy.nan: None})
            outTable = [outDf.columns.tolist()] + outDf.values.tolist()
            debug(outTable)
            result = {
                'outTable' : outTable
            }
            return result
        except Exception as e:
            print(e)
            raise HTTPException(status_code=500, detail=repr(e))
