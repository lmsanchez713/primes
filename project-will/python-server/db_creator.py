#!/usr/bin/env python

import mysql.connector
import json

with open('/code/mysql.json', 'r') as arquivo_json_mysql:
    credenciais_mysql = json.load(arquivo_json_mysql)
    mysql_db = mysql.connector.connect(host="localhost", user=credenciais_mysql["usuario"], password=credenciais_mysql["senha"])
    mysql_cursor = mysql_db.cursor()
    mysql_cursor.execute("DROP DATABASE IF EXISTS menezes;")
    mysql_cursor.execute("CREATE DATABASE menezes;")
    mysql_cursor.execute("USE menezes;")
    mysql_cursor.execute("CREATE TABLE usuarios(id_usuario INT UNSIGNED PRIMARY KEY AUTO_INCREMENT, " +
                            "usuario VARCHAR(128) UNIQUE NOT NULL, senha VARCHAR(128) NOT NULL);")