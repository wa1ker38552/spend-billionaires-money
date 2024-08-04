from billionaire import update_billionaires
from threading import Thread
from model import session
import ujson


from flask import render_template
from flask import request
from flask import Flask

def format_name(e):
    return ' '.join([i.lower().capitalize() for i in e.split()])

app = Flask(__name__)
billionaires = ujson.loads(open('billionaire.json', 'r').read())
inventory = ujson.loads(open('inventory.json', 'r').read())
inventory_sorted = sorted([inventory[key] for key in inventory], key=lambda x: x["price"])

@app.route('/')
def app_index():
    return render_template('index.html')

@app.route('/api/get/billionaires')
def api_get_billionaires():
    return billionaires

@app.route('/api/get/purchasable')
def api_get_purchasable():
    return inventory_sorted

@app.route('/api/purchase')
def api_purchase():
    global inventory_sorted, inventory
    target = request.args.get('i')
    if target.lower() in inventory:
        return {'success': True, 'item': inventory[target.lower()]}
    else:
        raw = session.send_message(target.lower()).text.strip()
        split = raw.split('|')
        try:
            if len(split) == 1:
                resp, emoji = int(split[0]), "❓"
            else:
                resp, emoji = split
                resp = int(resp)
        except ValueError:
            return {'success': False}
            

        if resp != 0:
            item = {
                'name': format_name(target),
                'price': resp,
                'icon': emoji
            }
            inventory[target.lower()] = item
            inventory_sorted = sorted([inventory[key] for key in inventory], key=lambda x: x["price"])
            with open('inventory.json', 'w') as file:
                file.write(ujson.dumps(inventory, indent=2))
            return {'success': True, 'item': item}
        else:
            return {'success': False}

app.run()

# session.send_message(input('> '))

