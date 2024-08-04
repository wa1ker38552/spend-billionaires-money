function dquery(e) {
    return document.querySelector(e)
}

function dcreate(tag, className=null, innerHTML=null) {
    const e = document.createElement(tag)
    if (className) {
        e.className = className
    }
    if (innerHTML) {
        e.innerHTML = innerHTML
    }
    return e
}

async function makeRequest(url) {
    const a = await fetch(url)
    const b = await a.json()
    return b
}

function addSuffix(value, round=0) {
    var suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qn'];
    var suffixIndex = 0;
    if (value > 999) {
      while (Math.abs(value) >= 1000 && suffixIndex < suffixes.length - 1) {
        value /= 1000;
        suffixIndex++;
      }
    }
    return value.toFixed(round) + suffixes[suffixIndex]
}

function renderBillionaire(target) {
    const card = dcreate("div", "billionaire-card")
    const icon = dcreate("img")
    const title = dcreate("h3", "", target["name"])
    const netWorth = dcreate("h3", "", "$"+addSuffix(target["net"]))
    const textContainer = dcreate("div")
    icon.src = (target["icon"]) ? target["icon"] : "/static/default.png"
    textContainer.append(title, netWorth)
    card.append(icon, textContainer)
    card.onclick = function() {
        // currentAmount = target["net"]
        dquery("#total").innerHTML = target["net"].toLocaleString()
        dquery("#targetBillionaire").innerHTML = target["name"]+"'s"
        billionaire = target["net"]
        updateLabel()
    }
    return card
}

function calculateReceipt() {
    let total = 0
    for (key in receipt) {
        total += receipt[key][0]*receipt[key][1]
    }
    return total
}

function updateLabel() {
    currentAmount = calculateReceipt()
    total.innerHTML = "$"+(billionaire-currentAmount).toLocaleString()
    if (billionaire-currentAmount > 0) {
        total.style.color = "rgb(88, 221, 36)"
    } else if (billionaire-currentAmount < 0) {
        total.style.color = "rgb(255, 99, 99)"
    } else {
        total.style.color = ""
    }
}

function renderResult(item) {
    const card = dcreate("div", "result-card")
    const emoji =  dcreate("div", "result-icon", item.icon)
    const textContainer = dcreate("div")
    const name = dcreate("h3", "", item.name)
    const price = dcreate("h3", "", "$"+item.price.toLocaleString())
    const adjustContainer = dcreate("div", "adjustment-container centered-vertically")
    const sellItem = dcreate("button", "button", "-")
    const buyItem = dcreate("button", "button", "+")
    const input = dcreate("input", "search-bar")
    card.title = `${item.name} - $${item.price.toLocaleString()}`
    input.type = "number"
    if (item.name in receipt) {
        input.value = receipt[item.name][0]
    } else {
        input.value = 0
    }
    card.setAttribute("data-amount", 0)
    buyItem.onclick = function() {
        input.value = parseInt(input.value) + 1
        card.setAttribute("data-amount", input.value)
        receipt[item.name] = [parseInt(input.value), item.price]
        updateLabel()
    }
    sellItem.onclick = function() {
        if (input.value > 0) {
            input.value = parseInt(input.value) - 1
            card.setAttribute("data-amount", input.value)
            receipt[item.name] = [parseInt(input.value), item.price]
            updateLabel()
        }
    }
    input.oninput = function() {
        if (input.value >= 0) {
            card.setAttribute("data-amount", input.value)
            receipt[item.name] = [parseInt(input.value), item.price]
            updateLabel()
        }
    }
    adjustContainer.append(sellItem, input, buyItem)
    textContainer.append(name, price)
    card.append(emoji, textContainer, adjustContainer)
    return card
}

function reloadItems() {
    buyResults.innerHTML = ""
    buySearch.value = ""
    makeRequest("/api/get/purchasable")
        .then(data => {
            items = data
            setTimeout(function() {
                for (let key in data) {
                    buyResults.append(renderResult(data[key]))
                }
            }, 100)
        })
}

var bList
var bQuery = {}
var items
var buyResults
var buySearch
var total
var billionaire = 0
var receipt = {}
window.onload = function() {
    const bResults = document.getElementsByClassName("billionaire-results")[0]
    const bSearch = dquery("#billionaireSearch")
    buySearch = dquery("#buySearch")
    buyResults = dquery("#searchResults")
    total = dquery("#total")

    makeRequest("/api/get/purchasable")
        .then(data => {
            items = data
            for (let key in data) {
                buyResults.append(renderResult(data[key]))
            }
        })

    makeRequest("/api/get/billionaires")
        .then(data => {
            bList = data
            for (let i=0; i<25; i++) {
                bResults.append(renderBillionaire(bList[i]))
            }
            for (let i=0; i<bList.length; i++) {
                bQuery[bList[i]["name"].toLowerCase()] = i
            }
        })

    bSearch.oninput = function(e) {
        let q = bSearch.value.toLowerCase()
        bResults.innerHTML = ""
        for (let key in bQuery) {
            if (key.includes(q)) {
                bResults.append(renderBillionaire(bList[bQuery[key]]))
            }
        }
        if (bResults.innerHTML == "") {
            bResults.innerHTML = "<i>No results found</i>"
        }
    }

    buySearch.onchange = function(e) {
        searchResults.innerHTML = ""
        if (buySearch.value.length > 0) {
            makeRequest("/api/purchase?i="+buySearch.value)
                .then(data => {
                    if (data.success) {
                        searchResults.append(renderResult(data.item))
                    } else {
                        searchResults.innerHTML = `<i>No results found for "${buySearch.value}"</i>`
                    }
                })
        } else {
            for (let key in items) {
                buyResults.append(renderResult(items[key]))
            }
        }
    }
}