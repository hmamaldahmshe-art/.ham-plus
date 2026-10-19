'use strict';
// هام بلس. Backend with no external packages. Node.js 20+.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {URL} = require('node:url');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const IS_PROD = process.env.NODE_ENV === 'production';
const zlib = require('node:zlib');
const BUNDLED_PUBLIC = {"/index.html":"H4sIAAAAAAAC/819aZMbx5Xgd/6KIigRgAVU4z6J5sgeaawN2dKakmdnGVyrABQaENEouFDoYyBE6CBlDtfhGY9nd2InHKEYK2weOiiKli3ZEftB+ye6v+oX+Cfsey+PyszKQqMlzcbOWE1UVVYeL9/9Xr66cnEYDKLjue+Mo/3p7oUr+I8z9WZ7vYwXZpzhJOxlwmiawUe+N4R/9v3IcwZjL1z4US+zjEbFVsbZEQ9m3r7fyxxM/MN5EEYZZxDMIn8GDQ8nw2jcG/oHk4FfpIuCM5lNook3LS4G3tTvlQuOeK84mkS9QXDgh4muo7G/7xcHwTQIld4vlfqlYbmeaD30F4NwMo8mwUxpffqzk3unt52v3vwX5/T26bsnn508cE7un946eQL/nDw8+Qzu3oUGJ1/Ao8end53TW/DwN3DvrdM7p+86p3fgfboBze+dPHId+PsEXvzi5PHJHxx6+PDkj9Dl3dO34dFDfIOenv7y9C3oFvr7B9Hso5NH0M8H1Ay6e3L6Mxjj1skDN7EYbz6f+sX9oD+Bfw79fhFuFAfe3OtPfWV1x/5iu1cXkRctF8W+F8LPY62P/tQb3CxGoTdbTJcDuLVdj9Ek0rphgGbvTiezm07oT3uZyQB3Yxz6I/Z7sTPyDvCHuzjYyziIjvBg39vzd+DGM0f7U7MHNngULAfjYrI386k7n+2ZPex7s8nIX0TiTXHtwlLiZ/gOrWmXo8wbCYQ5AzWu7LD3L1whEO9e6IRBEK2Kxf5ehyNtt1icezN/2rlUrpWblbK4rsCNdnlYaYsb1c6lSrnSqDbhBqzE74R7fS9XqdcL4j+31K7n4ak3wD3rXOq3RrWGJ28UF8EoYm+VW7VCpVYrlEuNglsu40uRfwSvjBqj5mgAl/vLyB92LrWbbd8bwfXheBL58HyEF4uxNwwOOyWn0pofOeVSCf5Sv6UC/r9brWGPoTecLBedSm1+tL7wnVU/OCouJn8/me11+kE49MMi3FkT51kBmQbTabHvjwEVgrCz2Acwjdf9YHi82vfCvcmsU+qOAK+KI29/Mj3uFNkuL44Xkb9f+C7u7A+8wTW6fB7aFTLX/L3Ad159IVN4xRsH+17h2RCYTWEBOF1c+OFk1O0Dku+FwXI27Bx4YQ43Jd8l1sKvESSwEMCJm5OoGHnz4niyN57CfxFjQR0ikbkXAnS7yK9G0+CweNQZT4ZDf0bTd6fB4OZKPJNPllEUzAqT2XwZFRb+1B9EBRwNevJWuM7OZDaGSUa85WqwDBcw3jyYAG2Fa2/FxuetuvhucegPgtBDZteZBTN/PdnfA+AdMXbbgV16et3psMGgzSqxfIYlAgSXypVyo1Jad0bBANjEwWQxAUazCpYRIV8FtnwRTCdDR3+ZPy8GoxFIiE4V9t5FhuDBzXDFprI/meXK5TZgTQFY/yCHU3OKTg0QJZ/v8v32llGwdgkNV+qm0J382l2ExWA2PV7Ng8WE1uz1YT7wsMvXOz/qjn3cK/pp7EB3MJ3MOyGAguNsKd8lFC/Cdg58AOBh6M3X7nwyna6Gk8V86h0DtGlpo6l/1PUADWZFeGF/0cGV+2F3z5t3mjAUw24cVYMQvptXkc5CvzWgX04cnHra7TZ0OfeGQyQcIjcAPaMFoCa/Q5d8y4aNYd9vslk77hA4DYNFM4ZFPEExQr30dDcNF9YX3D0A2orjXdE/gLsLQq9uEvCjyRQadfrTZZhr1mEzLSMFAN5JdNxxq/W1izoFYIXsaRFNBjePu1EwB3L/++JkNvSP4K2u5BdAC/sKYC0QbCRBXC4XytVCpVxwW/zpMAzmRXW2yKNiSk9vIqYMU1sJgOL+CAxJQ43Xl7C00XGRi8YOIRmwu+jQB1xExCm3kFL6wE+G58E3hgzQAHhyCEywU+KdABXd5LuPdCW2n37ru1KmW2nMQMxlL5wMu/ALpq1NQjCLUqVU6jO0PGRDtUslBU0rDPGOYtlRRqlRacAfdUQSUnm+iCIqGyulk7pAfWUMgpGgdPHiYtlX3sOhukkmonXVADyb+hFiOe4OUhvClnGjIqIkTJUxWtqLToivrd2Zd7A6a/txp6rlmE77VYB3SyXimrEwmA117XidMbIujQUK4hTI6BFDX2w1DQQFACkC/m+yKVWYWVBE8KByFZmQivVn4KmJ/Mps2sayWxrO0LA0K8Ye6OcoCPcdt9xaFGKcddwKXNKU8aeVk8OSOShlN6zDqRf5f5crVoi8sRWC88C3NyuxNsV5CBpqeLyNEO2XRto7fBaCtxAazfzFIld2S3Xe/RCpV+n7UqVWaVdbolfUwvgOqXhBEoZ1sDcOFtFqa2GT6CWpB7F+F/seCESBCm3EhGpSHBnYU+YoR+q4YEoVhSlVFPQqmW9XdPZ0qVKq1KuVs2aOMKJBHTAi+JhlRQ7Sb8RYpiu53mwG3Q/AupxFkpBIzp25xXVgfSNdRNeSMFE4BycAFfGbSO/qHNzFGOSumEgftUgQxqDtBbG4BFPGQ1TtgkIlOGC9Xlf1BWSvJafZsGhAKnIAqMEQ38N/YeycPwXtaOE7XgRc+mmn1nq6wGRtu1xoNgrlZrvgVvIFhWE4tfrTxJDCwCGVwQXQcbBXq6UY7tVKaZO4mfpgotSeJhWgUlPUhXJD6z06DETvNbX3utH7pUa10fTbrN9KFTQdpkO01K5brOsiyriVJvDwD6D//hypH3FtuT8DlByFDvzH2DqC28L0kpsk9JkyH42zQ0VFrzeJOfvHfj+EzTcQyOSTFolgCjC3HEswvvAKESNBclxWhhhMvf15rgaIUqgfHBYQY/K6aHXLbbP/YiwhQaCDOWiRz3Iwx13M/QHgWZosg1ZzddENRWDW+8PBwJhPu95VYIdGqDqXakkstDiIPF02kiAsC80J5UOHCQlq3veGe/7C8kYz8YaqHlQbckDWgwNgmq3ECsqmyK9soTdyk8LoNp2h2SDLuEbRCyOhstaIIJMYeoauBwwqjIpjbxqkGl3VtkqMdLHR2DAZz2ASDqZ+weKjqOfZ3Xal0IZ7wIjcch65jsaFmqWn87qWCXpmXbonyrVqoQzmQKXSBPnXBKwLwv4kSl9OS11Oq6Qbd0NvMfZtRki5arN8Yn0iDCJgJ6ByVIb+nphEp+ONAMgFcdX3oa2/EkpTJtNNm2U7nmP7XNZdl3SPToXEE2AwX6ABPUNBj+fLZ8g6QXOdc9kW745ucbbTMIyMSy2/XSMtJjkafwZm7BiFiFQScHZsxRViNPpCq614d5pSp71UrVZbtZY2dKlf8st1fegqzM9BfHUulUqldgEnA9PB60al4TW9wmS28CNHuQ/tLHtaLuOeWohLqs9NoTSZTiG2XoYGm/ed5mIx5Sstm/sBVSH4v3KpazHj+ajFCSi4YHomx9IgVylVS22+CaRU8M2pJLU+2i5EA8RJQgydCKRS/V9yRXiSFxNhbmmd+242n4eTkLm0OtMoVDhs22IsSi3TqevGXR25LJvBNNgL0rTU85jOsX5YBdP4LEN6g+lciyUbWpGAgG05W2dcVQ1kQwjW4lUNgvmxEEZeu1/q+zqoJPx9LxyMhdcVN5bTpemYsqvlimkgANDqt2tevaub43JaXjhcpaJsRRui3Cz3K01zD6qqbVreUqiWSwnNqBVPSrFTqoqIrTatts2ZW6usATUYL4wFXrlaB35R4K76wqVGoz9q1vPq7pf1ebneVDPs0npsV9utkV+4VK/V+/1BXusiGk8Q6md3Mqp5fZzWqNYst8p5ddOcRRQGsz3Ty6JbLFp7Mh3j5q0YQ9p9r9qvrF3ghl7EUCLJiIT+XElyuBQRbFq/rUK1Wqi1Cm67nOIHROactzEyTVjgHacmhEUjxj4kFlJbt/fExEt23NFAw7yWqnskMS9hF/er5VppOz7DMKtiTCC5oxVzRw2aqZk9oMZr9btd8vx+Y9AQrVGwI9slpkrSoW3RkFpMP2KvoMnHhyUrj+kdDctrTXrtgrvgkQ6xPw2yhtfiPvL9dJ+ZPxtu6bY1LSxiJMoYzriiwAQ1jYQdFdtp5D8oGbMEuyjNexk7yvj75FbVOrg5Gdy0exA3+d4q6iowvnZmB8261gGFfkY+SPPQL4aKM2ODZR36c3ghB1r6KMwzANdUiYYqpcMALHombqE4QCgaeUYMxkLfm3hhiXgh2BwDYCGXwIColf38djTeUIRTpaTOW/WFKTKmZpEx9XQtg7nLz0P0Vd3vpYLRwgBqZzCAprkVnM1vRlcies2WbwC5RkEw7XvheVQ/gnGKB8agSsbsiNdbbPuWqo+T4cJC0pgdwTaJxbzEVjJGwrvrdETkSL6kuRDX7mA8ma9UJcUhc11TbgagQQ3Pg7iJoEGSgiXz7fdrg6rVL45Tc7nLO1WVtThbTS0X7LPSEDkGqo8gLlPclNyAqzP9S3hvmBOP0LKs9OFQgHwVB7B1iPUJYgmfeArwBIHV7Wp8bBnUFJ1XhLuTnM2YJAuTr9IBpb6BHpykgsMEGgt6BJzzbfTzXPJq3rDvQc/LPhLP2RGgLajJ4tJbuzxxa3E4icA20DbBK/uVvoReLSUsdB60riZGdHgWBO+lpKKBGrUSYGmAsuF3tSiFZddLSSd9wiVvm4aFWi5Va9V+bajFHgbwJBIWV3vo1ft1U75ecL35fLG135lLx1oBCAloJ1ciMZmXzsm1y1LCVPXZQnwlNV5QaVbOEH91Lv5wo8EUKFfLzUolfy4Jq5loiXg5uVRjI56tNiXuJ+N8jMT4DaGb42UMhI3hPjU9ge1R0umIaUx6yBqVs2qdK/5VNlRCi9xMZCpVssB95IUR60rRCRqKV6+RdOtVKlvYnYrSWddtGOHMYt4ExNdqoUSZJUTw2vK8vViBRidZYi6tM9WTVM0xthJMOaYkLjG9CedipAMwh7zhNxGOC6YGt8SrmAoq3R91YJv9zQpJSyWSWlVhihLsMl0kOJKpI9QJxVLATlUaFIMQqakDCBlNBt406fyj/Z+Ngq2j+NJ4Hni1fkVdTVl3bZUbAgjYP9loz+CfhIv5qzd/kxEvkk2mDlMfNGrNGuuH6VR2LUoZmPQojjvGTFgPDiUiCLFv3LfF2C2Bgaodvew+AjOmsHaBx0bH5HQEgzQRok16+zdwOTXwilFY8hN0bblryqBC51a0GJu+TdoAw2d1pwm91d7c/kTV31HNAinT92aYfad2RZaUGWuvWNPXkpAD9i8Wip4Jh+hju3gy4pUtvtPQw8n1ytP5QkIUVbgo6leq1RL8Wy+3K9X8t5B9xbQcBibdXCeQKPoQs4t5y7mM7pX6zUHF0BFNjlKPWUjM3RolFqcMDs+rBqhGclP0sYj8+WrbBEQGwJpNtEhDh8xvxbpu1NWhHHe23F9tZu+Y4pXCpaVxVtI61VzaZEKrG6C3nZ/b1GzJ3sCA834KYFlEBthjB7HYpladGe+8vTP0I28CCneqe3o7VbepKkYtzjKUYRbLfWKBevrvpsSxFmXELSKW08+s1q+pnYiorzmbjhmieiZjRiusuQl6np4JyuvB3J/dSB3jqzv/nFFekpRHbsXqZsprG0wUNz4IIskRSTbVVPZdZV64iuljLbVL/bLMPSKRZttm0f95dUPpUbQllHA5KkiGRCkfRo3ttCugEAy3IwG2gorSEzr6LO4R0uBjXtcaNBKuQt4BVw3OgpCuFiRMgs1g4hNplpuDdsLjEbvWo8ADOkAvR2wOjSZH/lAEpUlis5g1/hIBhmrJ8KJz1Yb3uNITIS2e+arpmW9WS7WSJTBba9erDS0SzUDELvImVnszUIhYojS8DsK+Ul/wSbl7QTBcnWHPoL7DWvc9o/Elv9EEU3D9Vzf941EIavbCoTFWoxB2U6RKlbpWYwqN6/w6CmS7stKOHGCgg6DCCxA1t4KFskuJYA0/SdLMx3lTyrbIxLxEBKdBaZx8MBd5ipFE5w5D71BNOtfmQeF90lvjowp1dE4V0P1kSE88IFEWm88UZiuuyxWUS/YAeLlUhb5TLN7GYhtzWcGhYplxL3Yuh/IZxKoZQIzN4c+KmE280gR/Wt69urhvrnwRaSlzQAVMP/SjhKvUdnPRrMnYurSIml6lXzUsorU7mAYL3WsDGD+sDjZL7O3CwIqvFVX4lFlHXt/CXDUlgOyGypawV44cseMyyjiGzywlzXujHw0ESaNfj+dWEqmtlsUnXcvdzfmLtsnaPGuVNjDP6gYbrxjDnbJcZMd0ekx36jNTM9Zu1c1BARbzdnR1kNQ7U5Il9pOSKWYB2PnGSiqVVtWziYEyCIL2xryGSkpWsZDJw0FrWE+T8gKHmvHEdLPTcFSPJv50uDJeZvoGPnGmXt+f6mw17UBSfTjwW8lEiyQysJ7ZgTh+IQ7EiWt2dE2LBiRAWa1W+zV/E3XWR81R34wjVKolA9bVDc5/zTVUi+EiT/Apz1vYPvTpXen80fepqa2eBRJMGOh3GSS2CDko/V6ng7XU6obMqVPPltWZFhfuf608aGEZR8He3tS3JM+W7GqtHW/8st/wR0JtZ1o7w0DWPw8McSejjTfYAyd8gdYDM8KBZc3wJR1VWp+wvxM8gbrSWWNlfu5Ax3ZRZCUmQ9PoGhGYUWUQT8phv9T4clWJL1ft/PscEeSaHkE2xo2OIu7RU0MOSrNkkLmaCDKbZxXIMydvMnfSxH7OJx7HyDdSnZmtdrvuNZTGXFiK/Wxqju6U3RQ8buBX0aZQOb1HqThJN7nhpE2Em2JYDr3ZnkzaANnmeTjf4eRggicmlYOtCc87m5xwg9dYpJp1Ryd5tD69tesfUc0FNUNjAz1Q0NsvLufTwLOFmRJ+baU5p9q0fNZSN7Yz0h0ezF+2Hwy9qdW2E31JpbtpmA3bn1BTEzdSDZS0I6UtMkTieeq2CAKVP9V9SG0Kp1p0hDroCJ4t31c5A6GkSJN8xEciM7w0PBgbKQ5yfQ09OqQboYk9Fqti+nRyN5lFLZLKuY5FTh6VKbXqMVNqJaOzlca5mFKtnnLShQ9MZRhWWzklFS8jf5liR4mzJ4YTLj7a6Q8G8bhYneO8slRJTuVxrBiA8KKuVNbB1PE26o7JA3padyxpT+e/wgCotofe0Jbyo72vMHSh0tXjKYPC6a/OcEcJZ57Xbwykm5xsIWSKrMqIetCWJM+Fv9r3hxMvp9Y4wCMM+ZUSVj/Dha5H0tfxUZnYRqbyNDm31c7HxjuG83CKwkWKc5OnuNeJeTX5tKyFEFjxgyqApUDBANsh80ZTng5XDnZX2+phG22XK3Yxn3aumh4lAGycL3bio6lmMzyVKDJAmKJEHjVFD14iW1bP2aWSAVMnbWfUKGkokTrp1uSJtrmZumYQ7TpxFKpKtJbYbOTqHAuLPAW+WK2bCY2bl1AubUpTpLM2qtW/3hZpK9b0j7Ke/qF0rGV71C3uyrYMDyvpB0r5DPptvKMrM9VKWoS+rmSRxihST+ThJoNua5kPqAps4DV+NBjbnWBq9llMfCT0lRooMglQvccjpFIiNoX5f47BreHDihbd2wZjZBhP2beSFlGwewDTEkss7JP0O7tPvMTT0EpMjMd6VDPpoy03C5VSoVouuO34KHm6o8ReVgM5XoqT0KOxtDwuxHs0BAv+7CC38EbYyPeKpPQVaeb5vMOLykDzZxxbO7bUfF6FjeMV1KtzJpw1+6VB6Uxbzr5vuPOGZ6eUtA0UY6pZYRqwnGx8ILSinFeslIxmwrtm9xSwgJgRZeLathJJ4Q/aJRE6IRbDUxfrcZDEKDxkEdZ0PBSEYpLP1+QZZbsobijcmfESp1ivawxQ5XmNujXrRDfFNEu+qSbMmCYk7tcZGTVqDg2LlycFqeE7KCeswxhm89AfAcMqhv5wOfCHxf2A6+N4mV9ZK2iRP/g7he/wKcEPFlCNgwzF4ZJXi3JL5f3Fxck+2oEeYLWMM6U2gbld2PmOc80HO813vCHarcAdqa2zIMSfOd/ZueBOAwTEVnZa9T/GTisXqoUyGGqtStqZH4peqVO1mGriMea1BHuG+laoMS5mGHJYu23bo0pJ20eGomvWs9r6gSQkgpZI3GvJ2aoCXeEMjdL5Dq1ZE75Lo3Kj5Jk5hqZJlVQ1bHn5Yr62sgdbHFtZa5uTnr/TFGcnDb2wWjf2V1ckrak82qmmZMK01pvNX26xqbR3Nme+l/AIis39Xat6tb7tjKISnJKMp6b4uJlFpc9BPcpxqdlv1dpN04NlXZQw+02oiSX6YRiE9n2GCbbarbaus+pZha0YVmkeCJFryF0RBluwCPDBaFgdysMXqr+/yjLo1BiR4RBLSrYaN/c0liGZVBI/dIStEeu/ssMrRl7Z4ZVXMZwF/wwnB85g6i0WvYxaLybjTIbGnd0rO9CYl24FxZS/xa7gqdKTNEwdaXpizVdPPCerURTLvDQO9v2M44UTr0io3ctQ1cvPTt86+QhLY+LF45Pfnd49eQL/PdCHkkYsmzFd/gAvd09/dvomm/IV8Ud7iYwL5a0XcewMr80Zv6i/s1j2M7svv/jqNeflF5995fmXfvQD3pL/9WCZqBzxl+CnZWUPT989ffv0lrEyWJengWTXXDl2H7dB+4630crD6q1A/Yc1vYMlRR3o44vT26e39BYj76e8m/dPnsBgtwTMfw+9/e7kCz7uDqxFxxddC4HpMy1XAiyaOcLCZ2B+fbk/f5bPGivcnr5z8nusYGtZAusqrUueyptxhl7kFVG8Fklp2P3q3/4X1lC9EyPOw5OPYPW34x45EvP9YmvAYrSAr1hXlSnT8RLDgM2d7Yi6fCwc5ACbE4SReBYdBrZnKnFw70XGBGxcz0cfk9fygZuoH4q7WJ/RuDUMiGDx1q5zepuKEN8+u7wstedTHpfZwmEyr1AlXkQjhrTw/3cdqjb8EN778PRnV/qhs6PPgFfngbfewprHt2Gz7/ExsUqxKwcbl3evzOVQ15Z9VvcXUfId6J8wRK9/zIrlnvycFUImPsE2+7cnn508giaPRZlkW1FkmgHMGTHkCRZkRhTHxu8DWeIQD7BnLMyLSHofn91iK3+fXvsUERemP99N7lnkZUwKTcPdXX3q+goZJIlxsMBHLxOFSwDKV+/+kwScJ8nDIANzSKreBgN+DOD5DJd2B4b54vQdB8jFIIzEkliRII5du1/9+neOAj9ArIcnH8L87yCcxMRkS0F8DqEAIc5txBkY/x8SjWOII7zfdCYvXYOhnMnL3vClazpmchI2p+phiXALzDQZx0sO2QiT6tDYHlDVgUzyFq9ykvoKLz4igNcGS1Rf9r/+I/uf89X//ERfYqIrrCKiybRxVZSRZuQAhFQ12IIs1CFIV0My2H87aYqZJJdD7jBAwp//D6xRfh8af4D1x99VenZdN20JaElboYg1t3f/8t4/f6iKaxYG2EVsgbE+w+nzdfInV0if3DV5AxOw/B1oTI00IX2uiTneNMLJ/cI2OYQf8hbAU/vkAN9BisI+PWIs5iHwG3gHGOY3nxhV3aCp3bfB7QMsOq+wSwvcgB/A/D+zziUxI6Usg6y5YAgdXnAC5/SrxwoWxfC6zbYGYPA2Mo8vHCGAmERS5ojvapwaUP8WA6Jk2hausHHGTCBbZ/zVr+/bJmwID0YvuOXvGFMF2fAH1LBAisDMHp3+EvCVcb338RVkuA9t09W1Ea59JPUQqTPo2KBED+wPkgik1gvAjbr3wEp0+vcGkDV/Dvv1wIJEXIZ9RJybePxboDU+ENIXt+/eyafaxwjOQv5tZ//Vv/27ffIfggZwX5Pv1omz7zJogoeU3t/HnORDtoxYl7hH1PTw21rCX977l3s2xiJ1WClCb8NS3rUshCGe/SsRf4LFPzYEL18K3PgctubxBuJPR0d+yY1E0uitGq5+W4nPZJI2mV5eRFf/2Hw/RcoT0q+yS3LrIdvnNA2KjF6cUMLpgyT/u1gHrYAOilbJxwCkXwDMkHUCpQvMQFl5G+VcciA+uT8gV8Op/JY+xyEn9xBZxVyANKG1EwSjIPKmL5MSb3ZOuIz6ObP/FAai6T88tmVgGgtMsTHkRRggRNB3MTdMU6JlHMe6TJPApdZDr8e7yCNmBqPl5fXJ8rPqDVIxOtijD7d8NzjqZcgBVoP/ZRyYP8wR3UoZyhC4idu6DNHr8j32+RZ2l/lMepkKTICVf3QG0FO5DIr4Mfs37GWaOHv2GDbei8YOgGi/grWYirViDZ/iXaSBAyA18p4RGLkKxD8rIq7I3zkOpmBKoolvXyGKgjtIfQBl0JIydC5gEOzPp34EfQWjEX4i5MoOwdO2yaIsg77LWkkBttfs1jV+Z6sNj3dXcOyEPc/CPdzmZkPATURaaRdKC+lBwoLX3ppwjVqV/Jvbe0PWWhiqutGiYhrVSWBwCP3FcgrosZzFxrDCqgXz+hu0wOUqRdRcwArWDLQaTCdRbOl/TXHNIrqC9zEWxk0x1xEcGvmeuwX7EpKBbFGdjW0SCY9Jqbp/8kfa5Z87ICkfnv4S9/5zFM/wnN1n0gOePKbPEaGZQYyOf6+GzOVbNNt38Q1UceAJYTddIrdMSjHSAu7CnB7Q95Lg8hF5Iuh7RqhI3+IK0zvw5iNX4ZzndAQRN4ZR7d4gm+G7pbQbm6rWtyPsPoYNuRN/tYlApIg65r+D6T8htf1RvB2EPyfvsb1PUUZEvgD6JjBlHHli/ASTA/S5z5b7md1SOTY0NVdFLHeZyTmPebq083W8QzRD3sfkq9BI7GqiQDKpkMVfwYK7D8kl+SFHDL6Yc62qoqzqHn1ES1AKTAhtxrtoNYp1cSRCeoGLtxOikXnU7sHm4d8v1I9xMUbPSO5tvl+xg0qsWzJMoUc8gi7uoKr9DdZYVdcolsB8yUT6cn2/PfkEaBX5BbaTU2BaI298+t+xyUewhrv0H17SquMt/jlqSoAVwAreYQPdw73CzUeC/m0Mk9u0flKv7pOi/Ti50K+hgpIL+1snSjRQcR+5GQ0rJHNfJcwz3OYbaFIcPcZ5sBPLIMbYYWX08tzS6Ft67rWvvaU7cpEfiM5gn2Ez4G2kQuVrdFr3ih+P2+WxHTR5mQrDnt5BV5ywHt7BHUTHB9IziQuBArDfXBl+ePozdfN5l8mADpIXcH8Hpvl7lD/4pbz7gCTff+WVl68JGSBglAQW540o9O5qvmKGuR8SPj/CCxMsKKO+/MAqIb78c8ytvvwgydK+/DOC8wMAJDz9baz9y0Zf/hm/48c4JacJkqIcfpI5WLkCJz0nxylUOOhuEwP8CNeSZzL6Hgz9J2gJN986+fxsYAnMshox0B/au+Sr+hnyYIeQgvEnRvNw91NkkQYoU7pErs/2/32Y+wfMgXNLMnV0A5380UUuj8YWM0gdGA0AkeRahEs4J4Yt6K5HePNd38StdF1E2WXXUGrehWGfMP2FRnrI6cNYGnNN8yYkktkkkEJJikg3JIfWlvsilSByz1KEhYFEBCA+pR1/nJD9VlrnYAITmjQ5vu8fI39geEgoI+ChjEwOQ5vWJBwJyEIYsvMdY41wlLsi9oIiHZtxF5+cOdhEbFbcr+aosV4TTimiYIcH61iSmeSodLWVHIiTH4UY2BSaTok3nyfAzAb8LvX9jSPMV+bGOriLX35Lkn9olIiNkPBzyfKTBgGRIsf5zd8lVbTxJCyp0kPm3OHpLYPPsj0D52I5x8yxF2HMjDCS1GSvjBo2IDEOzEwNmBlmBLnAlFCZzZxANs1iiw8SpkMKTFg2jgj/fPmAW3W4gmOfvDU8QBvfx62k7EcDV6gdsCuNqJDN3WGe9I9w004+JxJSIkwAgH8UkV9DhZBinUJsrtU5zdahpzTEGaCmN0HNauB+00ROg+FM+Hb9PdKRU3XKJaddbDptp3lQLo+LjYNi8/vtg+b3q3/PnCzo1tkmveJbnR9m6jrQTTXjHNNf/qwJ/IaSk+hneIStd+Lm5dr52rPu8a1z9X/2CzHUkhRtj0T/x/nzKtyfVyF/XhWnJ7e/3HZrTrnuuGW37JTxt1vGgx1Oxa3Bv82i2/BaTot9e6NYoUaVadEFtHFbY7jRwgto2dKbFakZdOA2Xmw65YZbcVo0ktcGTKNmTgka1vApjtdy6057Si/EPTmiJzbEGIdjQ+ttaFJstk48eVxMRR0P7//XjCOzmjHqzSuB5IoVp1jJm1tnJsQkEnt4uRPGa8WFYAreAmvFCOcj5bFxryP/rTIFqx7Bm9CpPx6j505KlsBm+DfjCh2K50xP9BEKSsxH6RPHNh4qnWQiGULGRXSL6A4Fq+6SEcMUyGSYPMU5RWmEDCb081mkBINZ/ha0JTST387s/p9/3ZCDoRS1yOhEBregf/iFEDPZ6l/e+9Xvtsmrinsa+phnzcLJDBRs/Q8S8aL0LjxMf/nLe//8v9GUe3LysUOAAk2WPCR3z14m5iRmFOcsAu575hLxJg5oeD6oDkUmjqDdAcvoC0cX3EKDRTP4VkeG0hyRHSF8kPDnH4V6rBjcse4sjZVUPZdr37+Ff+6RRUVIejtWxIXKK00NANnpL9CO/fjkEw5AmrEKQpLvEniG5vO16rGJc9kZdBeJHo0ChV29fF5mdwsLkvmYOI6QzjYODp8dDtPyoWI9LLP7jGM1qW34I9HkReZL0Z/4w0mEooTlA+kYx46+y1esi8dU34zSE8+DU2M63L3AlksllnhY4Xn4nRGhIxYuYtOIO3xhSMqIpjjyehlmJM+f4i0WaoNGNMIPPZYkKr3zyry+I+NIcexKvIKnnqb+bA/Far0OvNf/6XIS+kM9jIUGO3ba0UJYlErCVKiE0mud5HP7wesToeKTUY6BggdODiyU2yef5u3zZG+pE20ZUbavfn3/PNMALuLvBZR2J33PcmhW/0SMHTe9EszJ5XjgTZcY7QtYQqOaXsRamC0pg5ssMkoPQtvD3pDH84DoHzH3f1rDPayhhg3JeXLv5H7ccIdNf2tQ/DUF1aTVleZ/ToGOeNuYH5g6YzWeh1JDCdfZF5UMA3KXUPoLehww0fy8sPixHy7Qi7yr++HsSCkaq2hZLRl4WXZLbulcmEnaLmV8iAQDGW0w5sG4yICpxwJb2RUH0KVGo+H7njL+1kixGIQTgmJml3snU1mKqCIU40T8sgaceimNu0jXKDCD+yefoJrxNmWjkZT+IpFqgQFzWIwYeet1vRoiwUoPor6iHHmYU1gQvskhvsSf2vTHUTRfdHZ2/CMP4/fuINjfgXcy7JwNaLbirR2epyOtZ6woK30W+lFA4uWYIfgO6pxvkcryJx5vUcJgKjvm0dNPlXiNa2T0aOkZrNyRIZYGY39wE1M2pOhiKUooq/ER7N3OLorkzylIR0481F2BSaD7/DaxuU+//LOE49cY8seTxaQ/9VNHtETduKolRzXFaOJcAs/ZWPb3J9GGtGzNLZpQPbS+2EXGnm/NDABvNvCnzzE9ZJc82H+CWf97woWEU7bkN0v95q+Zfp7Ugm3KjVCGU0L4wsRRQ/haAN91yKu9wbt7HpcurUmqRgs/iiazvQXXj76W8rMADTah/YiFWchZtte5k8KctuTX2BE7XQRrw9DxjsP0GOG0/CJFfMgXtRmck09jJ0lxIQy1s4RF/PZ5Vvt9sLvx3B2sGPaZYYuIb8vk3IQjzbp+2ZWm133NXfj+ZG88RRcV1+jeIe1FqDGMJbHQIjuvQjlG9mnJnkzF+BzTiY+tKMIzBpFddGovqoNXQHCeW9phb89qB/YonHqXImecZb+L9qWSoyB4QY6nPqKZCa/kU0Clda9OuNwoZVIEfDw2E2V3CEe49fwW+a85FmNs/fE5oU5xAFXCx37/M9akiPZ4L1h3dll/6Ln7/k670aDkvZ0tE5M0oSOFC7oFHpFjQLWdGfeSgkERCaYwQE/L+USBzI7GTNJ7lGDzUPNqWNwhgp8r7hBxYkTGOdO6c7WckIeoWVNaSapjw/lP1176IXOuPSFXDELnIQWmhIShmAeSVCxWWIrLLe5v4iErtQfuiFDP0MkCdRnNQcHua6BNKAdfvfsrdTFMW48hEG+epgJpeoGjVLDDDn/p8MOQTLg+SnYa0yArmMCmyBALO8s4mBQ4j0iRmk4GVDZh5/VFMCu4+DeZVrrZEbKreq3+IBXnGEMpe8iu0SYOtuvHsoECnpBT9TZfNWYAsiwha3CSWWUmrSASUEAL+bvqwVWypV2Hgu90DiMV5WCg+2JsDWlYrNNO2op2F/qgzbDt0FI1L41G/QqZqgokU9bCErRw6//AZKdAoc17ZCQnxUQg0/LONDmSR+rbgJBv/sYRMX6ErpCrdP7gDktReRh7Ry3JA0mHqXulH1LHTFEQGahxEJNyNWSUgGU+UEoFI/+HPHLJku2SqWUirQxbK2PxzAyZ1/Z7GjpO0hPu3B+CuQaEwhKfyCR0aF4AWTarD+m46QMtPy5xANSyR39571/+yUlCUO3G8BvOoavDIByScmxJED9LKILIepl3wdKyFZ1IGT0mIIugV/vgXGYur6Wqps+NR+6KccMtpfjMP7RMOJ4sd6+iw7BccZjSzfSIt8B6eefkg5PHNmVF7TZ9DSA3pQJTMcENXZx/OYNgNpqE+/GSAAPfxww19FWlb4dcpWUpZpff7nLOYRqrHvrYHrQvy67FpMZ9MM8gswW/xUDyNUzEl9yMKgOjbRJnCScUqTM0NOwYIDi4+dwRVya5qiPEBiomZ/WmTJKFI4K9YMnOXCNAPkzY+xRG1cOucXFX1hFd/y1e7iaaScfJD9iVFj+1xFfj4OPUH/aPeS88nmGLXzpKUVYllsmH2yaWKTRW6uh7sprBxkOmcWUwcTIKrhcbjmLEijGVQCFoic7iCkwCPnMU2LPIY25OM6VYLaJyHojSSZonICUotvfo5GPMDdS4fCbFbyTB+iIObUycg35bUGvvssOFeoKa3oKVkdDj80qCk0xwVlaGTeTqmOQ9+5iKNfgONz/BPF9umtMM6KdIPheZoRgYgRFvpTBPnoduFBmwqpEifs3kthS4BAyLKyrJ2qnlRlmlifUEH9ffT3Dxs+SpHvx68zdn/i/NrSLn8hyWTTJwzmf30k8+WeWF7PLaZt+qQJS4DBUwSIFRKQd1sN6FIUv4wVd+eAGzW3+Jbxgxep58TPtDJT1IHfwwVRAzy/Zd0sc/iafBk2cVr7rIQxUMiMU+di/kcvne7iq7XNDXMCaDKNu9AGQIFt+LL/z4uR5yDXHj2isv/ejZv3mulx17+z+ZT5eLnxyUZesBiz9O/EVvBSN2ssK/lS2wCCTckV6ObIFijZ1sHGvMFiiqCK1kVDFboPgh3hLxw+xajDf09wOsytO7fmE1GXayeF0slbMFTF9Vx+LR32zBx+hsJ4sVG7IFPt3jTpbNLltgp/Y6WYwJZgsHLGrWyZbdErQmHpG9VBv1W+0atpWhIxhKOWajHXx19KiHnJHpZBA6yYZ8eyWxQM0t35Ajni0sQ4B5tsBPbmPFr6VfOGARC7pYF1TQVQToEuUhFND9QgMdbWIq5CpuOYZco16vD0cG5FRnLFeFTAACWMlTbknbiKcpeaVWtYJBg1euOD88qhKVntDWPWaWpQ6PX32+CZVYpFhDploMkmG55dVaJkh4/oI092LkgkeU/WUgVgyQt1lumFj5Z+Rgf6xBB8N0Jw8swBh508UmaNQkNMwKHSp23FehQfScih1Vla68YWMwHKTTlf2YxsccCRSvSzw5uPExc6KKI+m8bojh4z4/YtQloUiH4uldFSfe2gAFzAXQEKKicJdWszyspSFETAuSQTpGmrzi4ZSb/oTaPIqPN8QnFpUk+fMjREMiBEbfbMjw2fasouw2FLqo1iut6gZkeJuXsxCne+IEOI3f0rwkehD+/0l4exgKPKFs/T9+jdU35eqlaLJA4GMVAiTLthMzFb/dbvsmIrDdF1zAUZx/5IYTR5fEdMxT02bJB1kZQvqGzg+GliSFO+QJ+NCGCA9vbaQHg0VWVBbpldpebZBOEep205bKWdARP5Xi08/xxRq4TOjZiilcuBHrIiNvOSWXag/VqdxKhIs7Kw4fsidA7fHCm3h1+ma2wIwNWGW/Nao1gDjGPNIIDVJL1kErEfhjktpSow40Lh6eIy3s/+NydAAEJTaH8OZnZODnuoBnGTroxnDnXrjwc/QTldTZ3mR0nBMaYD6/zoudeKp31NsdBoMl9ufu+dFzU+r6u8cvDHNHWLYXWwE29Ra93WvUVW5x9Wo2m3dDn4yV3M71y1d2M9kbO3uFAW5l9nK2k73s7c+72UL2Cv6eRvhzF3/u0c8M/vzpMsCLTDYDF5eq7W52fX1wIy+nduBNJ8NXwymOvJqMchcX+dAH3Jo52Ww3Co9XYEM5y97MP3Re/dGLuUW+yx8v3XkYoJk17fVA96a4Xvbq0sUTHwgnoK3BeCX7Wq+1ESl2jmPu/LdL10vFtlccPVt8/saqsX5qx438RQQjXYUOLzWbrdawmdVeBvD2vN6ud/kymk7ByPFwCkH/dTAmsvFNF5Ecn7DNgSfslguX+7m80lAhZKW9tCGmvjfjY+aQzfAd8tzJ8I03clmsNZ59BsjMd2fBYS7/TBYuf+BFYxdT5gMYyo0C/k61kXcXU+AxuUqhlc/nGaOSHeLVG2/gvrNGpUK9nuc8SzaiS2j11a/vKw1b+ZidxVbPdc8Vd2/g+sXFRVgm2EPZq/Etkwlel1yQqwdMONxwJ7PBdAkgyyHgsGn+qvhlChA5Z34DZo0iJZ51tZQvCFeHQAtoTrfyGoOVXSk3dVBV69AZMkiB09AYLvMxt7x40RMf/RhKrgmTY78AJiRZkG5HQP3kzsLIYi6/QkrgXLWn0P40GHjTa1EQens+0vULkb+f4wYp0BjQ0/Dy5aEr+O7ly8+GoXfsThb0b25I3xXJ5zmZKPzZdV2FfQMGiUcFfCKvODdi/fCPZ+QEjahQLuXdfW+eE6icX68Zgeb8/GrNiVQbcH0BCR9PIfS0+/iNF0ecLeKYw1CpwO+ypFZ+76dLH59n6TWW9/0DTOgjQNPNeQjtg+XiefxgYm+2nE67NPTCO/D/89Jf+r2Xw2B/svCBFS6C6YGfU7dnjngF3CK/uuA4bIMWM2++GAdRz2TMMH941VF6lr9cBgxyOqyBXMf+LOctjmcDugPviM7DnnfoTSJnhB8byWV3vPlkh3zUO9h9trDa96NxAJrIy6++wkQnTLCzynKXbfEVYDnAls3YMoiVAeAktABLDdjeAvgA/45RtoAHOTpiVWtaguMgqw7d4Gaeo6XPJxZSlBoQJl5RDpaU70bjMDh0yE+V813yTQH5kKL2iYxkoa8+m++uYYi1DiveHwHFgbcBLORPzmVRVXNkHFr0YgtddpzsM/CqCxrnAgimQEiQ7/KJ+yPY4DE/oQKbjBNYX2ADyv02W+HeACieymVZ9APYAfnL8ASD+KTTIpfFQ3TZPJdsuC6k5zO2lR8Hgj0deIMxsLZZUFwA/vrZxB6osM3+0I8Og/BmljfiA1D1JGOPlF7o8Rtv8B+SvuGOzjH4c8Y2tGFfmBHdO2LavHei4G0ZizE65y7KmEkWo3MVNiZi9/E13kkONYYZkAEqRWzNgvWEYV4gUYyHysme91G7w5QZmZXgsudv0zldkdd8j5JI4Bcobgyl1oA4MY9gQ+wv9gr4IXbyHcZUI7UyoD9gZ1wxA3SaHAAIfYZNmO7Yy1I/gMI57OZqFv8CKfdBNGJDzC/jVN6DsbqAkizgAigJAAEQAK/tAmhfmez7wTIi0kSmth8gT0PpVYKJy1kbQCQ9bNHD7ZT7010wFUdojEJ94Gq9KhlhZBe1/LgtXlFbUPqVltiQmQA9RSKLe/muhJf4wSHmkjsapwbsGrhydJzLisgF6M/f6P3iIhhBJ6+RVlDcnxzlJjNnEe71C85TK9H12ilXny6oX9DOv4ZfowhzCDkgDND0rmfj4vSgzyiFBOBKPy0ON+Jjj9kb+adyk2Fe22QG7nhBJOqu0ZGJIHx2Os1l44/CAYRhJs95iPW463o/2EKBDNlIvPtnss4bTlyMgIyjs2oLZLk9QdpbD/BQVh0HRKWbwqr43ngyHQKocuI+R1SDKF6B2WJeR04ij7AJEYHSjULQbzf2K4mtD3xbWEGLeSpNYtgLlrCYq1TJS6Nn8bYK1niuwjLFyaaYpsY8F/N8l8NNpJRm8/behU1Lqii+pJqOaS+pbdJejMUYS/qH5Y+Dw2zh4kX9fQk3ZqL2pPKLc6Nb1LtS5QHJnYiNn3Xs8Wdgb6KQA40fFVfx8irxMp3p57eSXUdeCIpwL/uT/tSDG8kGoT/twTAokv3QmQX0AaUQRPda4X5MZDzP6mzmBLvmITvoklfgBMixexaMRtJnr12fDMnOuoE84CUyE12AHNpHudhUyotR+qkIyGJnMGjfpaCduAHXCkYOxpM5SAlTSe71JiA1HHaqGCDNulHQg9hJH1ngsxFMDvqGTafoIYbaF/5Qqthan9iNNxw+dwAPEF8QrLnsABj6zWyB9Ffzrcmwa8BXE9FrCVRODv28ujXM0kOekBsKywWsIjAoub14NRszp2yHPwEpye5zHtXJppxvyypD7aOeACTD5iXHQhmoaiPoCxBG3OXLFsCTLfLGG7GtC/eMVvn4RW7AKK8N5R0yb7Vb2kvYy0USBG+8cZ2Z8wXNYi3YTfMb7uvBZJbLOkhAwYsBaLLf88C+zMfGNvUKHNVdACnlcl6hD1v7w+V+HwDQl1ZtvshvxYZuPp+gKw5PzjiArcx6OqgLeHIE6UyU9ARkxVsWMoNGSmlQg+Nl9VKDaADQcC7LrQLpFrv/skxl4tV7jY427nne3h15s5TRpNK3P4+Oz1L8sI1K1HSDvkEA7JE9ZUwUwfI9+lpgL1veKZbF0wmWJ/3+Kz94sZfV6hJN9qhQ9S9EtVVZzJ1qBr3NyiQ7ZqkBUad6vkuRyF+KOmi8OO59cXTnN5gjxQtExueVUgpEUvpGlm2sUFFx7sLHt2bQE5qLh6yER9XDYSoAee1BACI2U2EovgCYZU9iCL2mfVUCWsliUupNysMRaQ/KN6NQEfHC4h5+UgtnUK7Vh/5e4akVkF3O4lbKrwv0aeZaNZ/ZZa24Uy2/Zrvy1Comn6tZrSIuzc7by4jPbNDZGJ6Rg0x9HR+BV96g4lVyLLzCobTMYmyGjCJuprANbD1PAmQ2EjX4+UsKb5bOOXxXqWJ0ILrnLrn4cSK5Kf4sY2a7s3q25Eb1rGVcFdTIRcGRX2NYoanRscjdLOJQmaBsOnLK5vMaTmO3INSSXFCUOrDoF7IMwiYNAxlMzJgEk+HNVfo30sd3ZUE8SqFJREAwcug6ovJwXILxHaUO4EVGu5xQFfaYIFYsUHEGt8MmKqHiJyOL0F2WPVEJVaUFapZGlRvIz0J1iY+kUN/RURQftjGpRy/dz57apSv6ueL0nfza+fKPDpI4Fx+gl3xOGRqPsxTG+xitBCRk7ejvJvxHxyY/IkvpvDzyu91B16E32wNFmDkC4l4+Ovnk9C3Zw2tsJwzicJWBzyIRbArCXRCItTttDmd1iNEink+dy4qai48pO5tN3vnyg+wzHjdjv/zzyXtg5K0kpiZF+lFv9wgmd7HXozl2pW+3m6BX3aXEHICsCAjMmh3f573wBwF6BvmXjCh5TPqdUGqy6erpjoAnCUUYgUacxPBKIvuh2eWwdk9WuuBW23kaNQey6WxMdwwrbsjQZV9HglXXSuX8CidEabA5IcvJp5vmspTeN2BBGF/9dxYYTeZvaV5FmzPzLNefY/j7JV9iZhHnS6yl3akLOCn8uagw8opaqU3kAOhFN9vghzHRoUAU8IrXx+2jXuNSU+S5gZnqnkvht/QNXzY6HiVWxJ2AgEmbB/f/iamkrEi0itdtgYzRCLZag/VVtpC8dlMsTpm2Do3VBv/WdVGu6obi3zqSgieY9Y5cbAIWrYuE0evB3+6RxbXBjeICqCPw3GIBs0mhCYwai2bce4XJkCz769cl5RWyarmr7I3C9SyrySWesAoA7AHRXVaeBc3eEN4+zi+8i2ziAFC2ipjAk4wpbsQHzGNxvpgiFEALjgxDcYh56CJQ+SLwHM4VmanfofiYEke7eNHrShb3isVR5V3Nqt8D0FkcGOG22lDypFC2a2GfLHSXZLjeVYqHZ+klXh5JfShi2/wxVSVSn6thbd5GGOdqMyHVoSWLV/O2zABXWzL9F9qR0c6b8bozajs9Ni2GRl1FtlLVmKtMj4HmvEAMd99ppVv0eWgBa9741XCqNlqGU+WhKBqC9M1qeGAbaZJclXsQV/vQmwrV5ioJO3UX2cfIX5hFwY8n/mFuJb9Knl3sBxS8p+8Fw2UElhwKGW07k/xCx2/hVDAiFegF5HUj5KoXGkqIog7KYx6ikI9T9yQOL/CWojqC0pnispYdymoFajvFXSwbKl5g0U51/Ipmz+ouXNHUdPfGvZJfVOuU7mAjBcKxdaOyik18gkwTT8Q7txK5rFusPNyjtImrryl1nM2zB6ysq6Lix9kWoN473AecYT5gPDxB5UkTLl/rIYav3v1XWbHcXmsIa6S+1nlNFk2cLDzA9aH9W7mJEbrB3BtMouOO26h3B8twAbg/C0CNnk6DQ2mdUTl+ss7irHZWMN4RBz7x6KSioMOmqqezsvk0BweryP3/0J1xZVwxxuZVMuSJMn52LeGgqNi+jXseU0tYdnNjAufwdIgp4x5nbE9QKxduELP0GHd8MFPR6vrgVmTyNGVK5/Kbi0bnZzhgzjmMKKpnGWJrwJ93ZfKDJsagjB1kBf6j1sC+hSfSdrOJ0bgXDbnJOrH3QGw+1fO7ReG3z08edBiVfYjnyXHjfgcP2ccG+CdO9OMld6g25gd4NFUUleW1B+RHAtiXj5SSZ8bHCfjnBv7AsgieyBJc5oF65ilVjkM9xgN8vKZBTPN4VPIbmSDC5iA2bxWz8eNzWRP26X1LpkJc5UMKfqyhQdmi350G/dx1IwdrhYfOvKiDZ7WKeFYrThUsF1hv/vDZqIMdYEIlpU6+cO0lHjnNU/YbDLcuoCJcqORvFFboVElmVHUHY8zQi3rLaFRsoRoj5Waa3xoA4bHg5qs/epE/ZdFCzHzFhWGDYXA4w6TAnlxDEZn3EnNA06Yt0yvKpfwzWTKYswZacA+Dh0OQkyWHv0R2iJk3ghOEvQluKhNkc8/DGKVSXvdvPEQ8Rkc1rzajVbgQSTRaNY9s3tA/uDcBXRlPIX6JM49mwIeUG+14plRv4Jny9rdBMuY40lI36cYy+7NoYksSS6aoDQM2mo+eMxqSfrlITBQopOwr5k/gAedo1hPTYqc+MTYczVyh2fSEFr8J7hZfk7+Yww8/1eVE3alJiy9d+3azFk3yF0dwO2lIss6vtbw5QHjhZ+KLseXOsQeGVwtetaQ52o9gy2Q9BVkkCb2Pzk32LZz78jvfKd4xNtfYH5jId9u0iUpuJHrrQK0HnfR4pWECy1BOYh2wu9meL8B5DuRTKpQgEiqXYk8KSgEQbKJcyiZGYQ1sZtwSTbssY1Pp5GKvZ7RV0wLPqPghNZE/0vGrt0UKoIiMJEbjcZor5Uo8ivg4laVAD+oHerEUNbH1ffxIh2XIrZ2+giC+ERFaSU3ZSHUDNxCYoCyrj1ilJi3j94ziJYKyACHUejyUBwRCDYZT3aRd1XFN7xlybONYVGnzQ6VuBEbM7icqGsYVYrIp6ajJJGULxU2pKklOOvk3MFlol9jgTW59fngGMUmDTkqmtAEjjcHxkilZXShOZhOcud1bb88KkuKHb18yNsQqGGQLXADGSi1dbgonxa3iYbh8Tn3HZxEoXySc9Xr6m3mVlzMvloGA6SvQmSnzgMWFaDbNim02vYFfJTIYvKIfwpSfBxX276BRLt8908kefwVG9bX7096uPz07NM7xJ0/zen25P8ctPSu+h2dbEFncsbcYU/LGIpsMjmzeU2pFL4lqQ+d4JQ6EbPXGeQMV/d7uGYlzcSSkr8YxOBzZ96qts6NCJQxF2QEYgaVMBPIDaHqml5mCd+ZymHfhfCta6Slu8bJYZ19nUPI7pkd0joAwAWLG6hgA2Ucstg1cs5fUGtBnRqhTgr/Sp30mI8Ad9JPKExOdy3DaS/jy+d6iEIXnly9flO5Rco7GKofq0LgLIuk++wgjpUE+Onkfdc03HVEu1VQxeGYH6Vl6GEaaueJQBp1YxMDMEjYAVEqf5cJ2kkEaPnV+3NASpYkPGNrDM+LkoC0gI+18axiGnwG0hF60M4CpYRYxdYBxfNovLZQiT/6lxE/W3H3OwxMXdf/kKjYL3mGfgLN+M0QtlWLuHvQeO/InhiP/Bdimo6Q3f7LbK+Vly+uTGz2v60OnSjbscrYYT0ZRzsuvU58kkyqYcE8GMjcnTmAqs9A30oOLD9Fn6JhlYtQUC85J4yrm35gcLYGVbWlSjzbE3zw8N3lqsa/eStCbGQHj84pP7LCD+JZgmNpSOaRvi4vF5/VTYmFKX1ud50+LlQmak6f6U2Jlop12pn5DwCzul525hz1aK2hr6qx6Ig87emj/MrNAt9hruVG/lK3oJaWo4TneimsM218iPRO2k52qlJkT5ESVOgNeLa6610s3iC+RI5JH9tDugHt4y8U6tLuVn5RKJfzPSPCRZVjw88f3WV2nD9mHnLOCgELvUD3bzO0Z7Bp12FyeW4beIZ5T9A43HFKEh5YTiuoksF7qk7gqJMN/hx3jQ78Kc0pfTMsv08sdp313jtt+qp+Tl54BYxHtP0pJ46Dk5jDZYN60Zz8k2bUcpxSvoG+aHy4ZhcH+c/yAiXHeRAVcXmS+5a7f9I8LhP03QG+BC7DQ5FxkoQKR2CYKFLDTl/By4QBfw3+1I983MDbIjnDyHTnXEfENRHeG7NBocnNBbmSk7+KXsU8+AvpMHgxlvgasUsw+iM6PfSb6ZIhlP2G8Fp40XQ3vYVUKcYDBP5MhiJxHEynfx9mx6DAW0X108p4j63ITun1kfIwasf2TuPINr3LixqhoOXX/bWwFhbHUwty2MIBeQFuwTC02tdkao1aJ0NP5zHjlzbwa91LNomSPQDYYnFH6hDtILs8tBt4c5NGKJYra3f+Jw+KaL5gUKva6PaJmf53PW319m3PqqtNnvdkWdONPCDueaZZtxuWv0Sudukk39rAOy1Ge7DtYLOh1IZoAfxuEN2HFyNKgv8meB6NcvizdC6KMDJYkQWnTyeZlM1frwg39PVwJpirvLA7d19GHoVVuWF9gnq1uwkd2YZ3Hv1d2RIXJKzvoNsV/x9H+dPfC/wX0IOP4cPEAAA==","/sw.js":"H4sIAAAAAAAC/4VTUW/bIBB+z69gLwWrMVEr7WGKnCmqom1SNVVrqz5UfWD2xWbBwAxOmjX57zvA3ZasVV8Af4a77/vurjTaeXIxv/i8KGgj2tyq3uWuAaXy9Tmdjsp4YX59vbi5Lu4pn9AxLlJX8Mgb36r42Qotl+A838D353O6F57HNT/7cM6tro/h92fHsLBWQe5NXzZ5QI5+L8U6om5d04fpyIFaclFVizVofymdBw0doxJZC4XsIODF7CnufCOkv9VeKlaKsgHHjQXNovyM+wbPES9mcQtx50qxpD4bbrCsmMWsbiXtHQaUumZZlu2zV9mI0su18PAmnRVsHRvyhHMxu+pMKx1SQR4B4UupPMZcFbPVu6IYqLfCBmSIUoECD2yFpI45l0piYoe7kO0brJfgy+Yv5REhqRn6QsOG3H67ZElFBz/7UPy+UxiMELk8+tGCb0yFbOmnxQ3d7XpuOllLjUhMrUwpvMSaJjhcsMI3WrTAsYydd3fSN4xia8gJzbIOfN/pkGoyIV8xV0eicjK/+kIq4cWYiKqVmjhwDuO6MTEdsdA5o4WSv6AKSnyg+CJdU0GBZDV2Wh2qlj09X3DW6CqSieYcPsw4ykAwmD1Uoo3A4cCg6dNBwR7T/x/64O1RhljNRmI9cNntXmQR73Rg1TZVLUqM39ysTk7uqWxFDZM0VumMw3T6GIc5TJ9M5fgz1qc/0Dj6wJ1pgWHqFKsBUaGlvAbP6OBn7rcW/fr4b9k8Cn5KnVMauy3S61IZDSybvjqH6CG3vT8UNw4R0L99lJVcJDFg6IZ9sHYUOvo31b+FrtcEAAA=","/manifest.webmanifest":"H4sIAAAAAAAC/5WPQUoDMRiF9z1FiNvadoQu9CpSSiYTpqGZZEhS6FgKCjO1dO0J3LSK4EJ6l2TrSfwzmQoiBV38gXzv5b0/qx5CWJKC4RuE/aPb+wa5g6/dB/q8f0K+8Rt3dC8IhNo9+51/8Fu/QX57Au7g9u4d90OOmSltpz/TopIxQzUvLVeylb5jYxWEvLoj0B3U+wYub/B26w7I13/ptQR6F1qE7MGQy4wtBzNbiE6mqmRR6rbhphSkCgieyowIJVmUUkLnuVYLmU2pEkoHz8UoHWXJOBrsjBXsjCaIzAMk+tTTerTtFuFUSQPkFi4IrbDRNOgtHobzMrm+GpQQ0ofN+B0LZgxsCROYreJHeEFyNuyM5UKXyrScyAoVxMxJKhhe98/WjJPfNcCWMP+vgZZJb937Aj5fegZKAgAA","/icons/apple-touch-icon.png":"H4sIAAAAAAAC/+sM8HPn5ZLiYmBg4PX0cAkC0ltAmIMJSG5aPzGVgYF5haeLY0jFnLd3HL2iA0WOJ+qeO7KQOfwCa2fArgNBAuJXRHf08jE5Bv03zDxn+93u777AhRPizv3e+/nSrC+/vr37x3Xvc+43xojpFh1HHFX4lAoFOps9ZFweKQixT8Qv9CLtG+O5D59+mfzmMJWTn5cu/1DlunZ9/tPLVwqOnFq4RuJ4eMajeO6wTWEy8cbdzK9DNnnJbLLY4KT0+fGEo4LFwjMl23X8DDf2ZxZqPNYJFpr5uT/hlMX1KZ2l+XyRMSuKW7fk8aXGrCtuqy3UWOx1W2X2owC3tfMqy44s7BGUWmZlw5faY1y1ze68o4kZX3byloXCchLtRlU9sz+vsJhyMfPClr3PFaSE2rdezD9yJpdv0S+LNb2Rp9TziwVEjyfmngm1rp/dvMIIqJG1NfzgM6DHAm+me6TbBtfV/N/6/+t7e/vlcx4e4HLX+rniZdvjimree7NmnLBy1+pMXt0/tUSy7/+1AG65l06zex4fjvwe38PaX7LT95hj/ywLq/sFcyq4y+6t5JZb+aTrBlHhiFvo4tk3zDxbjupv0z/6DI+mLzPrP1z7dv9i/bX5H26SZ2Wufp/w/t5L35ZOvfx/zTnlqTfiZLas7Hz88eHOJ6V+Xx7q3qjvX1e2ZJL2pqtnC1Oubd72vcl914Wvb+/WnuTeu8du6p5zO+/V+ZdOzN5waKKX2fFnjx/EZtuGzbpfVuBydeuNV9V8Uh2g4PafJioSxzobZP3RwopN0Giw4zudPO3TydsyLs6PNtj86p3xc8XZhf1+zcvebnQyMeA7vfj4Dsv+uzK/JHJftNiGmeV82WtuA9Sy28qs3c4tY0bW5WRX+a1Vz25+n+csH3pLLfIb42PhnzKfVGflb3hnUabySf5X+Ps5+09VHZmTferIs5w+2d+PRYTzl8wsfOPxpGOndlmdjLWQ5YZDk8unAlUXbXUTs84+uvGzqXDk8s69oo9v/OaaqnPjyL1LhTI/TNaukTkSHd3VnAZMd6RGaD2j+e6rHSwHVH4Bsy6Dp6ufyzqnhCYAkWCUYeEDAAA=","/icons/icon-192.png":"H4sIAAAAAAAC/+sM8HPn5ZLiYmBg4PX0cAkC0gdAmIMJSN7d9zuAgYH5t6eLY0jFnLd3fbNCHEXaEpXPObXxbWISV2na4SDoJPaE605bc5tAks+u36tXFa/6XZmmdGTTq73Py+rynj/79u4zu8X1469YN5gzCgoKCJJMTPS/ym1x/PH8/KveM56+/uv8VcivePPR5lbxmDPS2zpWljpcv3l2v9X0KyYKL/esSvR8yzTp3O6o1CsaCi/nLPF00wVyb54yXvXfakKV0NPd4ZaNp/5/nr4kS2Sqr8LXntCt800ZV6a3TYrV5fCw/bzm/u2rQO62o9Z7TBS+rtlYNP8665J5U6e9/bao4crme7Ns4wUnVK3SufHzJePK5dfe/F3/P4wterb0hI+XD14JniExoerXjHKxvESXNNaUPyXGL118FJSCmYzqqmYV6qkJTPzIKGk/l9deVrjjxIOGnvn/js2byOni4uDixvbk39buRvWtT38z/z3/Xd9+/v+P19/Lh2r/DH++VdXNLiLCojFO5nzxU/erxbmL5Vz2tFx3yJ9zYXe9dfTzrbwbax2Oz3G8alkad1vjMNMnrir9xeey33OW/Hm6+5/T+z3bGr/xdRQxKSkpKFFGFAW+D/i2be39wwt0hTs6Gjo48BIxF/uLdf49jQn/dFlZjYxIhxE3rRc8ni8a8yfkoef/R7+28m4pd5hy225Bst79Vd57Pt/ad8+e56fFYSaprQuM99SybTXvOJct/QiU5lb0f/3x/PYK/tJ54u/TL7yq2LU29wprfSBj4Z6y7QbrLp9o4IpnK5zUqJ7KBEpiBxl3dn81/9bjA/KpkZ1C+cZzbfP7OF1SvBzaAvyNzx1lUTLSVnBeMdtTPYlJcKbEBMUrx/dsnmHdaHIFGPMF3LsLNq9/+JJR0ml67lGWSwFTWa33vxBbtvDrtTc/d113kIrKvJmnXyu4dqFp2LvPr84fMjG5/UhW74dJnDMoyc1az5yZAUyCsj8THq606bDwesgaKXmhscdp6+M9/6Il89I7P91dPd/Bv2fR5CnLiy9oLGCW3Lva04r9LZPVhIuro5YWXzABCsmavHnm+bphXky659zdlZvcHfRjsvyjRT4fmsZ40f3v9cYbswjFGTbiD+snx4cf3l28yQIsDRg8Xf1c1jklNAEApYoONjQEAAA=","/icons/favicon.svg":"H4sIAAAAAAAC/z2OzQ6CMBCE7z7FZj1DF1rRGMrBuw/BT6GN/KVUyuNbjHKYZOfLTGbzZe1gG/pxkaidm++Mee9jz+PJdiwlIhYSCKtR/jFtEgkIEvoKi9yq2oE3jdMSdwJamU67n7EhnwqE1vS9xHN1a0VWIivyuXQaGolPziG9riIbuIhEFo6dXEjz0FqcnV4q9BJKqoT+IDrmDtKbUdXlLNFO77HZB/ani9MHqZ+IRd0AAAA=","/icons/icon-512.png":"H4sIAAAAAAAC/+VW+1dTZxY9N7kBAgmPxCIBQvARsGoRQSXoQFBRRPExLVQiVh4KoiBEqBgqJhdBsJVnEYgVH7WjrTVohCpheF3QlgoYoFikKiSKQlEMKEqAkNCLdc1a8xfMWs4Pd+0f7jnft875zt77fLllkx/d1NYUAOj+63w/BiDB9GcyDYdsV5cCmN32910ZKCp50b2haXukXUZ7U25NXpRtjiOZMYuHOx4jJ6CbeuN9EybND3Q19m+7fPlxhr5WGxRklTIy2q0zA6+pBzoEujIBfKngc+J9hbuLDvFBN6ZTqbRi1PxJRejUfZ1VV/2piqGeIT1N1tyZ6BEu3QgXF2tlfhYZVhg1y/sBMw1B1bcGvY1nGTlzwXnna083Lm8mwjOuaq2cV/+hCd5+UrxpIzUnAMybNO5ZDPs8sM8Z2O3K4s1AeJYdm9Np9ukw2KrpmEuuYmJeJ8V5qWwqHifjp8wiV1libKlY9DUtNgCWRU48CnKTs5CuYwOZz/fgy9Aws06OxpEcw8QOnBSL8miyximmaE0nx6HfobTRAwvilcl5oRTrfjv8lYwvq7+zrQQWtrCOvlGENr9itkXYb+zKOptm/cgOd5PxY29nh6TDQlyQ/qLyYO4Is221/cquYtURh1mgLTcILd2EHD7SfXvi5n5FrtYKO8TbJ1wS95SNqqOULPuCquQFiCKbaeTXl9HjC3Hq2PqXld/fY2IxnkFC67jnhah6vpJZcnzFIToiOl2A7n7SV7sedjyi1SdX1i1iYsU8L2FS3EszVC1Q0lvULnw/ONN3C58b97oAVVOVplscweeIRRKfiXE8ua6FD/RkZCxnBCmv7FUxsKsltHnCjjpLwOYhY7kWlLZHtRInKD7eAV5x+jXgokQCK3UksAyywHJhi3Uo9jk8HnJQ/HTQkQ1YWRw0/WFcW/hZWjSUDdmJPk5knkfgnA0W9Sy1mFL8rQ2ASz2gcyy2X7phUQkwLFgA16vJFetLfefBJa3p8I9bAK60j8uDqT792aTtlxiAPV/j7WYKPoGzIV9KNps/uHY2wGSsGExZxp2uYq8+Y8Cc6Rb4GEa+/E3NrJtkwBNRcNybAFGSg+Qbi0X+TkTEzCw6ro4m2536t/NOIqJ5OiIKLopDyaNuCUFRRoBtfTe2Nck6jb6nVS7P5//+4nlv5uZW/QX+1PjOZudHu3uURWLdm6s1nHB/El6+I7jo7B/fZCevIMbqOybW2L3EReW2xG44KWnJQugw0PAJvkZzOHn47FPbHmVtxkctP8HwuUaPhiZZ44NwAQnfuqE0rVCQVnHzMYpNLawy+zRK0GMeY/MBFs5v3bcne43cbcPLJPPI35RZpqAVxJvJWnqr2Z1z4EDMVawwOb3i5o9EFevhtxvj8OfOvsPEPyeAfyaSXAdy+1Ln2JUvSyThpTcmNUMHM0KSV8T6AJx/m/AfyEDDWiSFlJKGrDssBkAcl0gnXvb/D+oG9RCYMjm8Z8gPanvt/rd6+YHEMNLYkyt04vBTCLmUtnpMUxGOMd5zsGVgKrE+hniCVVGxyjwQZk7T7kldjFF8Jt3kXY987i9T6fUNQk585vW3fbtbqkfajFv8RCtk6yF4P2WweZok7s7gbih/WCO7RhmN/LBH2Z4lOOWJqFc2uxw5LCiquGmLYleL7lN0ZcTZP1NBlZzCHmz+oppdxIXJP/Oz5YtiRpKC29751IaJtwaW7uktHvtcr4rdvqzvxWBky1kIRbGYavnSosiDPcpfULUCheDf/wVj7oD9sAeRztitjn5LehBy/67yh1TEZnQOW2g5ciMyDECRQVR0h4ZXx+/Fa9deaWoh9HD+dCPssHzVPeyzgO6CawioI4khXeoJn9RdR0Jsq+cWEPJlhoJakMY3hP5iHDbaTBbdGiZSS8aRYS4oWsfeSDkAZ06Y4GNZ5OML/tZLGQNb1ZJ6wdf6O4LoYktTn7kDeNryECtiyVHtpZxjJqm9LxVGUwBblICse8pW+O/jJBB3l0fA3nzjK1bbMyLA5bYHvfpcJbUdoI3u4z6Gt5bFtNEB51YbikXQtMjBkY0dN/IJSUGeIVD2+LnECju+GgKp+NPzSFtvZyiqNvseWf5Q24pC9DVDqAm+NYeSNxtU7SC9w54qgslfx7FLDzUcE5xZwpA21hhOAowIppypeIf9zLB/IKIiI5ymeZWIqrlKesnpkEkSIjraQe5/aqgNgB39tHpWZeVVBnaZ5y900QwuRdXbCI88+uALLqJI/YTS2H9mx2aI642tz6/81sMKO+UZLgzQ9JWiagfCcbNDkjM94lU1Kh1L+WxIIlHprKBDwkdEJ2h4jmxqziT6el6/xejjUa91YK2e0TD6sKpxnBq9WGx2ZJ/UcMEEb9gFn0bqZz5xPnfU87TcQRsjqEVkDVoILhoITQPZOqMwq04JlyR3oWN+UkMQFbfeBZow/T0nsGsHxZkBVQbErjdSB3VK3ElyMgtzPmnIJraWXVDrqifs5fRt2H9R4kcSmrj55A2oToP9MZpl+ITFKjD3M7Jpec35CuxP0Fy/7OY7IbzlXPXdgKl8Ku75K/RHaDevhE1rqTy3KokLSRgRga/s0hcwMOoJ7AVLj6BhtovDvNZKbBDpZobi1M9nN8L5wNR41oQTMYgTqh4LwL3/2zTeL3g2VXfLc8lHvJHDxG4P/ms2+V5ZFXbkL8gE058CDAAA"};

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const CATALOG = path.join(DATA_DIR, 'catalog.json');
const AUTH = path.join(DATA_DIR, 'auth.json');
const sessions = new Map();
const attempts = new Map();
const TTL_MS = 1000 * 60 * 60 * 24 * 7;
const MAX_JSON_BYTES = 750_000;
const DEFAULTS = {
  settings: {
    name:'هام',mark:'هـ',accent:'#b8f46a',headline:'كل اللي تحتاجه',
    highlight:'في مكان واحد.',subtitle:'اكتشف تطبيقات بلس، وتصفح الإصدارات والتحديثات بواجهة سريعة وأنيقة، مناسبة لكل أجهزتك.',
    announcement:'',support:''
  },
  apps: [
    {id:'demo-01',name:'تواصل بلس',emoji:'💬',category:'social',device:'both',version:'1.0',color:'#4fb894',description:'بطاقة تجريبية لتطبيق تواصل. يمكنك تغيير الاسم والوصف وإضافة الرابط من لوحة التحكم.',url:'',featured:true,visible:true},
    {id:'demo-02',name:'فيديو بلس',emoji:'🎬',category:'media',device:'both',version:'2.1',color:'#6555df',description:'واجهة عرض تجريبية لقسم تطبيقات الفيديو والمشاهدة والترفيه.',url:'',featured:true,visible:true},
    {id:'demo-03',name:'ستوري بلس',emoji:'📸',category:'social',device:'iphone',version:'1.4',color:'#d18a48',description:'مثال على بطاقة مخصصة لتطبيقات القصص والتصوير والمشاركة.',url:'',featured:false,visible:true},
    {id:'demo-04',name:'ثيمات بلس',emoji:'🎨',category:'tools',device:'both',version:'3.0',color:'#ad6cdc',description:'بطاقة لتطبيقات الخلفيات والثيمات وخيارات تخصيص الواجهة.',url:'',featured:true,visible:true},
    {id:'demo-05',name:'ملفاتي',emoji:'📁',category:'tools',device:'ipad',version:'1.2',color:'#4871d4',description:'مثال لقسم أدوات تنظيم الملفات والمستندات لجهاز الآيباد.',url:'',featured:false,visible:true},
    {id:'demo-06',name:'صوت بلس',emoji:'🎵',category:'media',device:'both',version:'1.6',color:'#d35283',description:'بطاقة قابلة للتعديل لتطبيق صوتيات ومشغلات الوسائط.',url:'',featured:false,visible:true},
    {id:'demo-07',name:'ألعاب بلس',emoji:'🎮',category:'games',device:'both',version:'1.0',color:'#2e999e',description:'قسم مخصص لاستعراض الألعاب وروابطها المضافة من المدير.',url:'',featured:false,visible:true},
    {id:'demo-08',name:'ويدجت بلس',emoji:'🪄',category:'tools',device:'iphone',version:'2.4',color:'#a09a4c',description:'مثال لتطبيق الويدجت وتخصيص الشاشة الرئيسية في الآيفون.',url:'',featured:true,visible:true}
  ]
};

fs.mkdirSync(DATA_DIR, {recursive:true,mode:0o700});
function writeJSON(file, obj) {
  const tmp = `${file}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  fs.writeFileSync(tmp,JSON.stringify(obj,null,2)+'\n',{mode:0o600,flag:'wx'});
  fs.renameSync(tmp,file);
}
function readJSON(file) {return JSON.parse(fs.readFileSync(file,'utf8'));}
if(!fs.existsSync(CATALOG)) writeJSON(CATALOG,DEFAULTS);
let catalog=readJSON(CATALOG);
function hashPassword(password,salt=crypto.randomBytes(16).toString('hex')) {
  return {salt,hash:crypto.scryptSync(password,salt,64).toString('hex')};
}
function verifyPassword(password,auth) {
  try {return crypto.timingSafeEqual(Buffer.from(hashPassword(password,auth.salt).hash,'hex'),Buffer.from(auth.hash,'hex'));} catch {return false;}
}
if(!fs.existsSync(AUTH)) {
  const initialPassword=process.env.ADMIN_PASSWORD || crypto.randomBytes(16).toString('base64url');
  if(initialPassword.length<12) throw Error('ADMIN_PASSWORD must be at least 12 characters');
  writeJSON(AUTH,hashPassword(initialPassword));
  if(process.env.ADMIN_PASSWORD) console.log('Admin account set from ADMIN_PASSWORD.');
  else {
    console.log('\n==========================================');
    console.log('كلمة مرور لوحة تحكم هام (انسخها الآن):');
    console.log(initialPassword);
    console.log('هذه الكلمة ستظهر مرة واحدة فقط.');
    console.log('==========================================\n');
  }
}
let auth=readJSON(AUTH);
const jsonHeaders={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
function response(res,status,obj,headers={}) {res.writeHead(status,{...jsonHeaders,...headers});res.end(JSON.stringify(obj));}
function error(res,status,message) {response(res,status,{error:message});}
function cleanText(value,max) {return typeof value==='string'?value.trim().slice(0,max):'';}
function validateCatalog(input){
  if(!input||typeof input!=='object'||!input.settings||!Array.isArray(input.apps)||input.apps.length>300) throw Error('تنسيق البيانات غير صحيح أو عدد التطبيقات كبير');
  const s=input.settings;
  const cleanSettings={};
  for(const [k,max] of Object.entries({name:35,mark:3,accent:7,headline:85,highlight:55,subtitle:250,announcement:160,support:250})) cleanSettings[k]=cleanText(s[k],max);
  if(!cleanSettings.name||!cleanSettings.headline) throw Error('اسم الموقع والعنوان مطلوبان');
  if(!/^#[0-9a-f]{6}$/i.test(cleanSettings.accent)) throw Error('لون غير صحيح');
  if(cleanSettings.support&&!/^https:\/\/[^\s]+$/i.test(cleanSettings.support)) throw Error('رابط التواصل يجب أن يستخدم HTTPS');
  const ids=new Set();
  const apps=input.apps.map(a=>{
    if(!a||typeof a!=='object') throw Error('بيانات تطبيق غير صالحة');
    const app={
      id:cleanText(a.id,90),name:cleanText(a.name,55),emoji:cleanText(a.emoji,8),
      category:cleanText(a.category,20),device:cleanText(a.device,20),version:cleanText(a.version,30),
      color:cleanText(a.color,7),description:cleanText(a.description,350),url:cleanText(a.url,1000),
      featured:a.featured===true,visible:a.visible!==false
    };
    if(!app.id||ids.has(app.id)||!app.name||!app.description) throw Error('تطبيق ناقص أو معرف مكرر');
    if(!['social','media','tools','games'].includes(app.category)) throw Error('تصنيف غير صحيح');
    if(!['iphone','ipad','both'].includes(app.device)) throw Error('نوع الجهاز غير صحيح');
    if(!/^#[0-9a-f]{6}$/i.test(app.color)) throw Error('لون التطبيق غير صحيح');
    if(app.url){
      try {const u=new URL(app.url); if(u.protocol!=='https:') throw Error();}
      catch{throw Error('روابط التطبيقات يجب أن تستخدم HTTPS');}
    }
    ids.add(app.id);return app;
  });
  return {settings:cleanSettings,apps};
}
async function bodyJSON(req){
  if(!String(req.headers['content-type']||'').startsWith('application/json')) throw Error('Expected application/json');
  const chunks=[];let total=0;
  for await (const chunk of req){total+=chunk.length;if(total>MAX_JSON_BYTES) throw Error('JSON too large');chunks.push(chunk);}
  try {return JSON.parse(Buffer.concat(chunks).toString('utf8'));} catch {throw Error('Invalid JSON');}
}
function cookieMap(req) {
  return Object.fromEntries(String(req.headers.cookie||'').split(';').map(s=>s.trim()).filter(Boolean).map(s=>{const i=s.indexOf('=');return [s.slice(0,i),s.slice(i+1)];}));
}
function session(req) {
  const cookie=cookieMap(req).ham_sid;
  if(!cookie||!/^[0-9a-f]{64}$/.test(cookie)) return null;
  const key=crypto.createHash('sha256').update(cookie).digest('hex');
  const item=sessions.get(key);
  if(!item)return null;
  if(item.expires<Date.now()){sessions.delete(key);return null;}
  return {key,item};
}
function secureCookie(token,maxAge=604800){
  return `ham_sid=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`+(IS_PROD?'; Secure':'');
}
function rateLimit(req){
  const ip=String(req.socket.remoteAddress||'unknown');
  const now=Date.now();
  if(attempts.size>2000)for(const [key,item] of attempts)if(item.reset<now) attempts.delete(key);
  let item=attempts.get(ip);if(!item||item.reset<now){item={count:0,reset:now+15*60*1000};attempts.set(ip,item);}
  if(item.count>=10)return false;
  item.count++;
  return true;
}
function checkOrigin(req){
  const origin=req.headers.origin;
  if(!origin)return true; // Non-browser clients still need the session token.
  try {const parsed=new URL(origin);return parsed.host===req.headers.host && (parsed.protocol==='https:'||(!IS_PROD&&parsed.protocol==='http:'));}
  catch{return false;}
}
async function api(req,res,pathname){
  if(!['GET','POST','PUT'].includes(req.method))return error(res,405,'Method not allowed');
  if(req.method!=='GET'&&!checkOrigin(req))return error(res,403,'Origin rejected');
  if(pathname==='/api/catalog'&&req.method==='GET'){
    return response(res,200,{settings:catalog.settings,apps:catalog.apps.filter(a=>a.visible).map(a=>({...a,description:a.description.replace('يمكنك تغيير الاسم والوصف وإضافة الرابط من لوحة التحكم.','').replace('المضافة من المدير','المتوفرة في المنصة').trim()}))});
  }
  if(pathname==='/api/admin/login'&&req.method==='POST'){
    if(!rateLimit(req))return error(res,429,'محاولات كثيرة، حاول بعد 15 دقيقة');
    const b=await bodyJSON(req);
    if(!b||typeof b.password!=='string'||b.password.length>512||!verifyPassword(b.password,auth))return error(res,401,'كلمة المرور غير صحيحة');
    const ip=String(req.socket.remoteAddress||'unknown');attempts.delete(ip);
    const token=crypto.randomBytes(32).toString('hex');
    sessions.set(crypto.createHash('sha256').update(token).digest('hex'),{expires:Date.now()+TTL_MS});
    return response(res,200,{ok:true},{'Set-Cookie':secureCookie(token)});
  }
  const current=session(req);
  if(!current)return error(res,401,'يلزم تسجيل دخول المدير');
  if(pathname==='/api/admin/data'&&req.method==='GET')return response(res,200,catalog);
  if(pathname==='/api/admin/data'&&req.method==='PUT'){
    const body=await bodyJSON(req);
    let cleaned;
    try {cleaned=validateCatalog(body);}catch(err){return error(res,400,err.message);}
    writeJSON(CATALOG,cleaned);catalog=cleaned;
    return response(res,200,{ok:true,updatedAt:new Date().toISOString()});
  }
  if(pathname==='/api/admin/password'&&req.method==='POST'){
    const b=await bodyJSON(req);
    if(!b||typeof b.oldPassword!=='string'||!verifyPassword(b.oldPassword,auth))return error(res,403,'كلمة المرور الحالية غير صحيحة');
    if(typeof b.newPassword!=='string'||b.newPassword.length<12||b.newPassword.length>128)return error(res,400,'كلمة المرور الجديدة يجب أن تكون 12 حرفًا على الأقل');
    auth=hashPassword(b.newPassword);writeJSON(AUTH,auth);
    sessions.clear();
    return response(res,200,{ok:true},{'Set-Cookie':secureCookie('',0)});
  }
  if(pathname==='/api/admin/logout'&&req.method==='POST'){
    sessions.delete(current.key);
    return response(res,200,{ok:true},{'Set-Cookie':secureCookie('',0)});
  }
  return error(res,404,'Not found');
}
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
function serveStatic(req,res,pathname){
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end();}
  let requested;
  try {requested=decodeURIComponent(pathname);}catch{res.writeHead(400);return res.end();}
  const adminRoute=requested==='/admin' || requested==='/admin/';
  const urlPath=requested==='/'||adminRoute?'/index.html':requested;
  if(!Object.prototype.hasOwnProperty.call(BUNDLED_PUBLIC,urlPath)){
    res.writeHead(404);return res.end('Not found');
  }
  let content=zlib.gunzipSync(Buffer.from(BUNDLED_PUBLIC[urlPath],'base64'));
  if(urlPath==='/index.html'){
    let html=content.toString('utf8');
    if(adminRoute){
      // Keep management accessible by direct link while always verifying its session server-side.
      html=html.replace('</body>',`<script>document.querySelector('[data-open-admin]')?.click();</script></body>`);
    } else {
      // Visitor view: remove management advertising and hide the admin entry points.
      html=html.replace(/<button\b[^>]*\bdata-open-admin\b[^>]*>[\s\S]*?<\/button>/g,'')
        .replace('</head>',`<style>[data-open-admin]{display:none!important}</style></head>`)
        .replace(/<section class="container"><div class="banner">[^\n]*<\/section>/,'')
        .replace('لوحة تحكم مرنة','اكتشاف أسهل')
        .replace('أضف التطبيقات وغير المحتوى والمظهر','تصفح أحدث التطبيقات حسب اهتماماتك')
        .replace('✦ تحكم في المحتوى','✦ تصفح بسهولة')
        .replace('إذا أضاف المدير رابطًا حقيقيًا للتطبيق','إذا توفر رابط مباشر للتطبيق')
        .replace(/<details><summary>كيف أضيف تطبيقًا جديدًا\؟<\/summary>[\s\S]*?<\/details>/,'')
        .replace(/<details><summary>هل تعديلاتي تظهر لكل زوار الموقع\؟<\/summary>[\s\S]*?<\/details>/,'')
        .replace('التطبيقات الأولى أمثلة للعرض فقط. لا يظهر زر فتح الرابط إلا بعد أن تضيف رابطًا حقيقيًا من لوحة التحكم. المنصة نفسها لا توقع تطبيقات iOS ولا تستضيف ملفات التنزيل.',
                 'قد تكون بعض البطاقات للعرض فقط. يظهر رابط فتح التطبيق عند توفره. المنصة لا توقّع تطبيقات iOS ولا تستضيف ملفات التنزيل.');
    }
    content=Buffer.from(html,'utf8');
  }
  res.writeHead(200,{
    'Content-Type':MIME[path.extname(urlPath)]||'application/octet-stream',
    'Cache-Control':urlPath.endsWith('.html')?'no-cache':'public, max-age=3600'
  });
  if(req.method==='HEAD')return res.end();
  res.end(content);
}
const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  try{
    const pathname=new URL(req.url,'http://localhost').pathname;
    if(pathname.startsWith('/api/'))await api(req,res,pathname);
    else serveStatic(req,res,pathname);
  }catch(err){
    console.error('Request error:',err.message);
    if(!res.headersSent)error(res,err.message==='JSON too large'?413:400,'تعذر تنفيذ الطلب');
    else res.end();
  }
});
if(require.main===module)server.listen(PORT,HOST,()=>console.log(`هام بلس يعمل على http://${HOST}:${PORT}`));
module.exports={server,validateCatalog};
