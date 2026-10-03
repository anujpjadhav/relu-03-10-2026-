with open("/tmp/dcl_spa_main.js") as f:
    js = f.read()

pos = 0
while True:
    idx = js.find("available-sailings", pos)
    if idx == -1: break
    print("=== available-sailings ===")
    print(js[max(0, idx - 200): idx + 300])
    pos = idx + 20
