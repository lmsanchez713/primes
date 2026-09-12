#!/usr/bin/env python

# WS server example

import asyncio
import websockets
import sys

async def ainput(string: str) -> str:
    # await asyncio.get_event_loop().run_in_executor(
    #         None, lambda s=string: sys.stdout.write(s+' '))
    return await asyncio.get_event_loop().run_in_executor(
            None, sys.stdin.readline)

async def hello(websocket, path):
    async for name in websocket:
        # name = await websocket.recv()
        print(f"< {name}")

        greeting = f"Hello {name}!"

        await websocket.send(greeting)
        print(f"> {greeting}")

async def server_proc(parada):
    async with websockets.serve(hello, "127.0.0.1", 9713):# as websockets_server:
        await parada

async def main(parada, server_ws):
    saida_solicitada = False
    while saida_solicitada == False:
        # entrada = input("> ")
        entrada = await ainput("")
        entrada = entrada[:-1]
        # print(entrada)
        # print(len(entrada))
        if entrada == "exit":
            print("Saída solicitada")
            saida_solicitada = True
    print("Encerrando servidor websockets")
    parada.set_result(0)
    await server_ws

print("Mimes Broker Server v1.0.0.666")
print("Digite seu comando ou 'exit' para sair")

loop = asyncio.get_event_loop()
# loop.set_debug(True)

# start_server = websockets.serve(hello, "127.0.0.1", 9713)

parada = loop.create_future()

server_ws = loop.create_task(server_proc(parada))
loop.run_until_complete(main(parada, server_ws))
# asyncio.get_event_loop().run_forever()

print("Saindo do servidor... Obrigado!")
