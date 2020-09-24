let db
const request = indexedDB.open('budget_tracker', 1)

request.onerror = event => console.log(event.target.errorCode)
request.onupgradeneeded = function(event) {
    const db = event.target.result
    db.createObjectStore('budget_transactions', {autoIncrement: true})
};
request.onsuccess = function(event) {
    db = event.target.result
    if (navigator.onLine) {
        uploadBudgetTransactions()
    }
};
function saveRecord(record) {
    const transaction = db.transaction(['budget_transactions'], 'readwrite')
    const objectStore = transaction.objectStore('budget_transactions')
    objectStore.add(record)
}
async function uploadBudgetTransactions() {
    try {
        const transaction = db.transaction(['budget_transactions'], 'readwrite')
        const objectStore = transaction.objectStore('budget_transactions')
        const getAll = objectStore.getAll()
        getAll.onsuccess = async function() {
            if (getAll.result.length < 1) {
                return
            }
            try {
                const postStream = await fetch('/api/transaction/bulk', {
                    method: 'POST',
                    body: JSON.stringify(getAll.result),
                    headers: {
                      Accept: 'application/json, text/plain, */*',
                      'Content-Type': 'application/json'
                    }
                })
                const postResponse = await postStream.json()
                const transaction = db.transaction(['budget_transactions'], 'readwrite')
                const objectStore = transaction.objectStore('budget_transactions')
                objectStore.clear()
                alert("Offline budgets have been submitted!")
                location.reload()
            }
            catch(err) {
                console.log(err)
            }
        }
    }
    catch(err){
        console.log(err)
    }
}

window.addEventListener('online', uploadBudgetTransactions)
