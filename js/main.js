let config = new Configuration();
let cardContainer;

window.onload = function()
{
    document.querySelector(".geo-button").addEventListener("click", () => alert("clicked"));
    document.querySelector(".add-button").addEventListener("click", () => FetchCity(document.querySelector(".new-city-input").value, AddCard))

    var removeButtons = document.querySelectorAll(".remove-button");
    removeButtons.forEach(function(elem){
        elem.addEventListener("click", RemoveCard)
    })

    cardContainer = document.querySelector(".city-cards-container")
    LoadLocalStorage()
}

function LoadLocalStorage()
{
    let savedCities = localStorage.getItem(config.LocalStorageItemName)
    if(savedCities)
    {
        JSON.parse(savedCities).forEach((item) => cardContainer.appendChild(FetchCity(item, GetCityCardFromJson)))
    }
}

function RemoveCard(item)
{
    var card = item.currentTarget
    while(card.className != "city-card"){
        card = card.parentNode
    }
    cardContainer.removeChild(card)
}

async function FetchCity(cityName)
{
    let apiUrl = config.BaseApiUrl + "?q=" + cityName + "&appid=" + config.ApiKey
    await fetch(apiUrl)
        .then(x => x.json())
        .then(x => AddCard(x));
}

function AddCard(jsonItem)
{
    let newCard = GetCityCardFromJson(jsonItem)
    cardContainer.appendChild(newCard)
    let savedCities = localStorage.getItem(config.LocalStorageItemName)
    if(savedCities){
        savedCities = JSON.parse(savedCities);
        savedCities.push(jsonItem.name)
        localStorage.setItem(config.LocalStorageItemName, JSON.stringify(savedCities))
    }
    else{
        localStorage.setItem(config.LocalStorageItemName, JSON.stringify(Array.of(jsonItem.name)))
    }
}

function GetCityCardFromJson(jsonValue)
{
    let newCard = document.createElement("li")
    newCard.classList.add("city-card")
    newCard.innerHTML = `
        <div class="city-card-header">
          <h3 class="city-font-color"></h3>
          <p class="tempareture-font-color"></p>
          <img src="images/Sun.png" style="max-height: 60px; max-width: 60px; height: auto; width: auto;">
          <button type="button" class="remove-button">x</button>
        </div>
        <ul class="weather-property">
          <li><span class="property-key">Ветер</span><span class="property-value"></span></li>
          <li><span class="property-key">Давление</span><span class="property-value"></span></li>
          <li><span class="property-key">Влажность</span><span class="property-value"></span></li>
          <li><span class="property-key">Координаты</span><span class="property-value"></span></li>
        </ul>`;
    
    newCard.querySelector("h3").textContent = jsonValue.name
    newCard.querySelector(".tempareture-font-color").textContent = jsonValue.main.temp + " ℃"
    let properties = newCard.querySelectorAll(".weather-property li");
    properties[0].querySelector(".property-value").textContent = jsonValue.wind.speed + " m/s"
    properties[1].querySelector(".property-value").textContent = jsonValue.main.pressure + " hpa"
    properties[2].querySelector(".property-value").textContent = jsonValue.main.humidity + "%"
    properties[3].querySelector(".property-value").textContent = "[" + jsonValue.coord.lon + ", " + jsonValue.coord.lat + "]"
    return newCard
}