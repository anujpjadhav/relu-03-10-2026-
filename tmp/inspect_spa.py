import re

with open("/tmp/dcl_spa_main.js") as f:
    js = f.read()

terms = ["serverPath", "serverHost", "pageKeyEndpointUrl", "featureToggleUrl", "product-avail", "sailings", "destinations"]
for t in terms:
    pos = 0
    found = 0
    while found < 5:
        idx = js.find(t, pos)
        if idx == -1:
            break
        print(f"=== {t} ===")
        print(js[max(0, idx - 80): idx + 120])
        pos = idx + len(t) + 1
        found += 1
