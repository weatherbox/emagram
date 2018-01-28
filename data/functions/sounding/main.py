import re, json
import requests

endpoint = 'http://weather.uwyo.edu/cgi-bin/sounding?'

def fetch_all():
    # JMA sounding points
    # http://www.jma.go.jp/jma/kishou/know/upper/kaisetsu.html#kososite
    ids = ['47401', '47412', '47418', '47582', '47600', '47646', '47678',
        '47741', '47778', '47807', '47827', '47909', 
        '47918', '47945', '47971', '47991']

    data = {}
    for id in ids:
        data[id] = fetch_point(id)


def fetch_point(point_id):
    url = endpoint + 'TYPE=TEXT%3ALIST&YEAR=2018&MONTH=01&FROM=2612&TO=2612&STNM=' + point_id
    req = requests.get(url)

    # <H2>47778  Shionomisaki Observations at 12Z 26 Jan 2018</H2>
    h2 = re.findall(r"<H2>(.*?)</H2>", req.text)
    name = h2[0].split(' ')[2]
    print(h2[0], name)

    # <PRE>data</PRE>
    pre = re.findall(r"<PRE>(.*?)</PRE>", req.text, re.DOTALL)

    # sounding
    #-----------------------------------------------------------------------------
    #   PRES   HGHT   TEMP   DWPT   RELH   MIXR   DRCT   SKNT   THTA   THTE   THTV
    #   hPa     m      C      C      %    g/kg    deg   knot     K      K      K
    #-----------------------------------------------------------------------------
    rows = pre[0].splitlines()

    levels = {}
    for row in rows[5:]:
        d = row.split()
        pres = d[0]
        data = d[1:]

        if len(d) == 7: # no dew point
            data = d[1:3] + [None, None, None] + d[3:6] + [None, d[6]]
        elif len(d) == 5: # no wind
            data = d[1:3] + [None, None, None, None, None, d[3], None, d[4]]
        
        levels[pres] = data

    # Station information and sounding indices
    # http://weather.uwyo.edu/upperair/indices.html
    infos = pre[1].splitlines()
    info = [row.split(": ")[1] for row in infos[1:]]
    labels = [
        'ID', 'TIME', 'SLAT', 'SLON', 'SELV',
        'SHOW', 'LIFT', 'LFTV', 'SWEAT', 'KINX',
        'CTOT', 'VTOT', 'TTOT',
        'CAPE', 'CAPV', 'CINS', 'CINV',
        'EQLV', 'EQTV', 'LFCT', 'LFCV', 'BRCH', 'BRCV',
        'LCLT', 'LCLP', 'MLTH', 'MLMR',
        'THTK', 'PWAT'
    ]

    indices = {}
    for label, value in zip(labels, info):
        indices[label] = value

    return { 'name': name, 'indices': indices, 'levels': levels }


if __name__ == '__main__':
    #fetch_point('47778')
    fetch_all()


