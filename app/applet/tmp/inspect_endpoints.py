with open("/tmp/dcl_spa_main.js") as f:
    js = f.read()

idx = js.find('availableSailings:"available-sailings/"')
if idx != -1:
    print("OBJECT:")
    print(js[max(0, idx - 500): idx + 300])
