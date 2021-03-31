let config = new Configuration();
let cardContainer;
let helperTemplate;
let cardTemplate;
let mainCityTemplate;

window.onload = function(){
    document.querySelector(".geo-button").addEventListener("click", RefreshGeo);
    document.querySelector(".add-button").addEventListener("click", async () => {
        let inputebox = document.querySelector(".new-city-input")
        let cityName = inputebox.value
        inputebox.value = ""
        try{
            await FetchCityByName(cityName)
            AddCardToLocalStorage(cityName)
        }
        catch{
            alert("Такого города нет!")
        }

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
    helperTemplate = document.querySelector("#helper-template")
    cardTemplate = document.querySelector("#city-card-template")
    mainCityTemplate = document.querySelector("#main-city-template")
    RefreshGeo()
    LoadLocalStorage()
}

function LoadLocalStorage(){
    let savedCities = localStorage.getItem(config.LocalStorageItemName)
    if(savedCities){
        JSON.parse(savedCities).forEach((item) => FetchCityByName(item))
    }
}

function RemoveCard(item){
    let cityName;
    var card = item.currentTarget
    while(!card.classList.contains("city-card")){
        if(card.className == "city-card-header"){
            cityName = card.querySelector("h3").innerText
        }
        card = card.parentNode
    }
    cardContainer.removeChild(card)
    RemoveFromLocalStorage(cityName)
}

async function FetchCityByName(cityName){
    let loader = GetLoader(cityName)
    loader.querySelector('h3').textContent = cityName
    cardContainer.appendChild(loader)
    let apiUrl = config.BaseApiUrl + "?q=" + cityName + "&appid=" + config.ApiKey + "&lang=ru"
    let response = await fetch(apiUrl)
    if(response.status === 404){
        cardContainer.removeChild(loader)
        throw new Error("Invalid city")
    }
    let card;
    try{
        card = GetCityCardFromJson(await response.json())
    }
    catch{
        card = GetErrorCard(cityName)
    }

    card.querySelector(".remove-button").addEventListener("click", RemoveCard)
    loader.replaceWith(card)
}

function AddCardToLocalStorage(cityName){
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

function RemoveFromLocalStorage(cityName){
    let savedCities = localStorage.getItem(config.LocalStorageItemName)
    savedCities = JSON.parse(savedCities);
    let itemIndex = savedCities.indexOf(cityName)
    savedCities.splice(itemIndex, 1)
    localStorage.setItem(config.LocalStorageItemName, JSON.stringify(savedCities))
}

function GetCityCardFromJson(jsonValue){
    let newCard = cardTemplate.content.cloneNode(true).querySelector(".city-card")
    newCard.querySelector("h3").textContent = jsonValue.name
    newCard.querySelector(".tempareture-font-color").textContent = GetTemp(jsonValue)
    let properties = newCard.querySelectorAll(".weather-property li");
    SetValues(properties, newCard.querySelector(".city-card-header img"), jsonValue)
    return newCard
}

function RefreshGeo(){
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

async function RefreshMainCity(fetchurl){
    await fetch(fetchurl)
        .then(x => x.json())
        .then(x => {
            let loader = document.querySelector(".loader")
            if(loader){
                loader.replaceWith(GetMainCity(x))
            }
            else{
                document.querySelector(".current-city-card").replaceWith(GetMainCity(x))
            }
        })
        .catch(x =>{
            let error = GetMainCardError()
            let loader = document.querySelector(".loader")
            if(loader){
                loader.replaceWith(error)
            }
            else{
                document.querySelector(".current-city-card").replaceWith(error)
            }
        })
}

function SetValues(properties, icon, jsonValue){
    properties[0].querySelector(".property-value").textContent = jsonValue.wind.speed + " m/s"
    properties[1].querySelector(".property-value").textContent = jsonValue.main.pressure + " hpa"
    properties[2].querySelector(".property-value").textContent = jsonValue.main.humidity + "%"
    properties[3].querySelector(".property-value").textContent = "[" + jsonValue.coord.lon + ", " + jsonValue.coord.lat + "]"
    icon.src = config.BaseImageUrl + jsonValue.weather[0].icon + ".png"
}

function GetTemp(json){
    return Math.round(json.main.temp) - 273 + " ℃"
}

function GetLoader(cityName){
    return GetHelpCard(cityName, "Данные загружаются...")
}

function GetErrorCard(cityName){
    return GetHelpCard(cityName, "Произошла ошибка")
}

function GetHelpCard(cityName, text){
    let help = helperTemplate.content.cloneNode(true).querySelector(".city-card")
    help.querySelector('h3').textContent = cityName
    help.querySelector("p").textContent = text
    return help
}

function GetMainCardError(){
    let error = GetErrorCard()
    let button = error.querySelector("button")
    button.parentNode.removeChild(button)
    return error
}

function GetMainCity(jsonValue){
    let mainInfo = mainCityTemplate.content.cloneNode(true).querySelector(".current-city-card")
    mainInfo.querySelector("h2").textContent = jsonValue.name
    mainInfo.querySelector(".tempareture-font-color").textContent = GetTemp(jsonValue)
    SetValues(mainInfo.querySelectorAll(".current-weather-property li"), mainInfo.querySelector(".current-city-weather img"), jsonValue)
    return mainInfo
}