#!/usr/bin/env bash
# Демо curl-запитів до API (потрібен запущений сервер, порт із PORT або 3000).
# Використовувався для скріншота terminal-curl.png у reports/screenshots/.
# Ідентифікатори демо-користувачів беруться з API, тому скрипт ідемпотентний.
set -u
BASE="http://localhost:${PORT:-3000}"

pp() {
  node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.stringify(JSON.parse(d),null,2))}catch(e){console.log(d)}})"
}
first_id() { # $1 — JSON-масив, виводить id першого елемента
  node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).data[0].$1))"
}

echo "\$ curl -s $BASE/health"
curl -s "$BASE/health" | pp
echo
echo "# список юристів, сортування за ціною (перші 2 записи)"
echo "\$ curl -s '$BASE/api/lawyers?sortBy=pricePerHour&order=asc'"
curl -s "$BASE/api/lawyers?sortBy=pricePerHour&order=asc" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log(JSON.stringify({data:j.data.slice(0,2)},null,2))})"
echo

CLIENT_ID=$(curl -s "$BASE/api/users?role=CLIENT" | first_id id)
LAWYER_USER_ID=$(curl -s "$BASE/api/lawyers" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).data[0].user.id))")

echo "# створення консультації (ціна за замовчуванням = ставка юриста); clientId=$CLIENT_ID lawyerId=$LAWYER_USER_ID"
echo "\$ curl -s -X POST $BASE/api/consultations -H 'Content-Type: application/json' -d '{...}'"
CONS=$(curl -s -X POST "$BASE/api/consultations" -H 'Content-Type: application/json' -d "{
  \"clientId\": $CLIENT_ID, \"lawyerId\": $LAWYER_USER_ID,
  \"topic\": \"Договір купівлі квартири\",
  \"description\": \"Перевірити договір купівлі-продажу квартири та оцінити ризики для покупця.\"
}")
echo "$CONS" | pp
CONS_ID=$(echo "$CONS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).data.id))")
echo
echo "# помилка валідації → 400 з деталями по полях"
echo "\$ curl -s -X POST $BASE/api/users -d '{\"email\":\"bad\",\"name\":\"A\"}'"
curl -s -X POST "$BASE/api/users" -H 'Content-Type: application/json' -d '{"email":"bad","name":"A"}' | pp
echo
echo "# невідомий маршрут → 404"
echo "\$ curl -s $BASE/api/nope"
curl -s "$BASE/api/nope" | pp
echo
echo "# прибирання демо-запису"
echo "\$ curl -s -X DELETE $BASE/api/consultations/$CONS_ID -o /dev/null -w '%{http_code}'"
curl -s -X DELETE "$BASE/api/consultations/$CONS_ID" -o /dev/null -w '%{http_code}\n'
