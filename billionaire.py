import requests
import ujson

def update_billionaires():
    r = requests.get('https://www.forbes.com/forbesapi/person/billionaires/2024/position/true.json?filter=uri,finalWorth,age,country,source,qas,rank,category,person,personName,industries,organization,gender,firstName,lastName,squareImage,bios')
    r = r.json()
    raw_data = r['personList']['personsLists']
    formatted_data = []

    for person in raw_data:
        formatted_data.append({
            'name': person['person']['name'],
            'icon': f'{"https:" if person["person"]["squareImage"].startswith("//") else ""}'+person['person']['squareImage'] if 'squareImage' in person['person'] else None,
            'net': person['finalWorth']*1000000
        })

    with open('billionaire.json', 'w') as file:
        file.write(ujson.dumps(formatted_data, indent=2))

    return formatted_data