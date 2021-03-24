let config = new Configuration();
let cardContainer;

window.onload = function()
{
    document.querySelector(".geo-button").addEventListener("click", RefreshGeo);
    document.querySelector(".add-button").addEventListener("click", 
    () => {
        let cityName = document.querySelector(".new-city-input").value
        FetchCityByName(cityName)
        AddCardToLocalStorage(cityName)
    })

    document.querySelector(".new-city-add-area").addEventListener("submit", function(event) {
        event.preventDefault()
        document.querySelector(".add-button").click()
        document.querySelector(".new-city-input").value = ""
    })

    let removeButtons = document.querySelectorAll(".remove-button");
    removeButtons.forEach(function(elem){
        elem.addEventListener("click", RemoveCard)
    })

    cardContainer = document.querySelector(".city-cards-container")
    RefreshGeo()
    LoadLocalStorage()
}

function LoadLocalStorage()
{
    let savedCities = localStorage.getItem(config.LocalStorageItemName)
    if(savedCities)
    {
        JSON.parse(savedCities).forEach((item) => FetchCityByName(item))
    }
}

function RemoveCard(item)
{
    let cityName;
    var card = item.currentTarget
    while(!card.classList.contains("city-card")){
        if(card.className == "city-card-header")
        {
            cityName = card.querySelector("h3").innerText
        }
        card = card.parentNode
    }
    cardContainer.removeChild(card)
    RemoveFromLocalStorage(cityName)
}

async function FetchCityByName(cityName)
{
    let loader = GetLoader(cityName)
    loader.querySelector('h3').textContent = cityName
    cardContainer.appendChild(loader)
    let apiUrl = config.BaseApiUrl + "?q=" + cityName + "&appid=" + config.ApiKey + "&lang=ru"
    var card = await fetch(apiUrl)
        .then(x => x.json())
        .then(x =>  GetCityCardFromJson(x))
        .catch(x => GetErrorCard(cityName))

    card.querySelector(".remove-button").addEventListener("click", RemoveCard)

    await new Promise(r => setTimeout(r, 2000));
    loader.replaceWith(card)
    return card
}

function AddCardToLocalStorage(cityName)
{
    let savedCities = localStorage.getItem(config.LocalStorageItemName)
    if(savedCities){
        savedCities = JSON.parse(savedCities);
        savedCities.push(cityName)
        localStorage.setItem(config.LocalStorageItemName, JSON.stringify(savedCities))
    }
    else{
        localStorage.setItem(config.LocalStorageItemName, JSON.stringify(Array.of(cityName)))
    }
}

function RemoveFromLocalStorage(cityName)
{
    let savedCities = localStorage.getItem(config.LocalStorageItemName)
    savedCities = JSON.parse(savedCities);
    let itemIndex = savedCities.indexOf(cityName)
    savedCities.splice(itemIndex, 1)
    localStorage.setItem(config.LocalStorageItemName, JSON.stringify(savedCities))
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
    newCard.querySelector(".tempareture-font-color").textContent = GetTemp(jsonValue)
    let properties = newCard.querySelectorAll(".weather-property li");
    SetValues(properties, newCard.querySelector(".city-card-header img"), jsonValue)
    return newCard
}

function RefreshGeo()
{
    navigator.geolocation.getCurrentPosition(
        function(geolocation){
            let lat = geolocation.coords.latitude
            let lon = geolocation.coords.longitude
            let url = config.BaseApiUrl + "?lat=" + lat + "&lon=" + lon + "&appId=" + config.ApiKey + "&lang=ru"
            RefreshMainCity(url)
        },
        function(geolocation){
            let url = config.BaseApiUrl + "?q=Moscow&appId=" + config.ApiKey + "&lang=ru"
            RefreshMainCity(url)
        }
    )
}

async function RefreshMainCity(fetchurl)
{
    await fetch(fetchurl)
        .then(x => x.json())
        .then(x => {
            document.querySelector(".loader").replaceWith(GetMainCity(x))
        })
        .catch(x => document.querySelector(".loader").replaceWith(GetErrorCard("!")))
}

function SetValues(properties, icon, jsonValue)
{
    properties[0].querySelector(".property-value").textContent = jsonValue.wind.speed + " m/s"
    properties[1].querySelector(".property-value").textContent = jsonValue.main.pressure + " hpa"
    properties[2].querySelector(".property-value").textContent = jsonValue.main.humidity + "%"
    properties[3].querySelector(".property-value").textContent = "[" + jsonValue.coord.lon + ", " + jsonValue.coord.lat + "]"
    icon.src = config.BaseImageUrl + jsonValue.weather[0].icon + ".png"
}

function GetTemp(json)
{
    return Math.round(json.main.temp) - 273 + " ℃"
}

function GetLoader(cityName)
{
    let loader = document.createElement("li")
    loader.classList.add("city-card")
    loader.innerHTML =
    `
        <div class="city-card-header">
          <h3 class="city-font-color"></h3>
          <button type="button" class="remove-button">x</button>
        </div>
        <p style="font-size: xx-large;">Данные загружаются...</p>
        </ul>
    `
    loader.querySelector('h3').textContent = cityName
    return loader
}

function GetErrorCard(cityName)
{
    let error = document.createElement("li")
    error.classList.add("city-card", "error")
    error.innerHTML = 
    `
        <div class="city-card-header">
          <h3 class="city-font-color">${cityName}</h3>
          <button type="button" class="remove-button">x</button>
        </div>
        <p style="font-size: xx-large;">Произошла ошибка</p>
        </ul>
    `
    return error
}

function GetMainCity(jsonValue)
{
    let mainInfo = document.createElement("div")
    mainInfo.classList.add("current-city-card")
    mainInfo.innerHTML = 
    `
    <div class="current-city-info">
        <h2 class="city-font-color">${jsonValue.name}</h2>
        <div class="current-city-weather">
          <img src="">
          <p class="tempareture-font-color">${GetTemp(jsonValue)}</p>
        </div>
      </div>
      <ul class="weather-property current-weather-property">
        <li><span class="property-key">Ветер</span><span class="property-value"></span></li>
        <li><span class="property-key">Давление</span><span class="property-value"></span></li>
        <li><span class="property-key">Влажность</span><span class="property-value"></span></li>
        <li><span class="property-key">Координаты</span><span class="property-value"></span></li>
      </ul>
    `
    SetValues(mainInfo.querySelectorAll(".current-weather-property li"), mainInfo.querySelector(".current-city-weather img"), jsonValue)
    return mainInfo
}