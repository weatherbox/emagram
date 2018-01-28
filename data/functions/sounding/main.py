import re, json
import requests

endpoint = 'http://weather.uwyo.edu/cgi-bin/sounding?'


def fetch_point(point_id):
    url = endpoint + 'TYPE=TEXT%3ALIST&YEAR=2018&MONTH=01&FROM=2612&TO=2612&STNM=' + point_id
    req = requests.get(url)
    print(req.text)

    match = re.findall(r"<PRE>(.*?)</PRE>", req.text, re.DOTALL)

    # sounding
    #-----------------------------------------------------------------------------
    #   PRES   HGHT   TEMP   DWPT   RELH   MIXR   DRCT   SKNT   THTA   THTE   THTV
    #   hPa     m      C      C      %    g/kg    deg   knot     K      K      K
    #-----------------------------------------------------------------------------
    rows = match[0].splitlines()

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

    print(levels)

    # Station information and sounding indices
    infos = match[1].splitlines()
    print(infos)


if __name__ == '__main__':
    fetch_point('47778')


