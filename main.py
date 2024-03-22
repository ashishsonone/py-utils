from typing import Any, Dict, AnyStr, List, Union

from fastapi import FastAPI, HTTPException

from pydantic import BaseModel
import duckdb
import pandas as pd

app = FastAPI()

JSONObject = Dict[str, Any]

import os

DEBUG_ON = os.environ.get('DEBUG') == '1'

def debug(*args):
    if DEBUG_ON:
        print('DEBUG', *args)

@app.post("/api/sql/")
async def run_sql(body: JSONObject = None):
    try:
        tableData = body['tableData']
        # prin t(tableData[1])
        query = body['query']
        debug('query=', query)
        debug('head=', tableData[0:5])
        mytable = pd.DataFrame(tableData[1:], columns=tableData[0])

        out = duckdb.query(query)
        # print(out)
        outDf = out.to_df()
        outTable = [outDf.columns.tolist()] + outDf.values.tolist()
        result = {
            'outTable' : outTable
        }
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=repr(e))

