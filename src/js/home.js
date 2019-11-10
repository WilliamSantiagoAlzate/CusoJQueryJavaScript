console.log('hola mundo!');
const noCambia = "Leonidas";

let cambia = "@LeonidasEsteban"

function cambiarNombre(nuevoNombre) {
  cambia = nuevoNombre
}

const getUserAll = new Promise(function(todoBien, todoMal){
  //Llamar a un api
  setTimeout(function() {
    todoMal("se acabó el tiempo")
  },5000)
})

const getUser = new Promise(function(todoBien, todoMal){
  //Llamar a un api
  setTimeout(function() {
    todoMal("se acabó el tiempo")
  },3000)
})

getUser
  .then(function() {
    console.log("Todo está bien en la vida")
  })
  .catch(function(message) {
    console.log(message)
  })

Promise.all([getUser,getUserAll])
  .then(function(message){
    console.log(message)
  })
  .catch(function(message){
    console.log(message)
  });

//Ingresa a la promesa que termina primero
// Promise.race([getUser,getUserAll])
//   .then(function(message){
//     console.log(message)
//   })
//   .catch(function(message){
//     console.log(message)
//   })

//Petición desde jQuery
// $.ajax("https://randomuser.me/api/", {
//   method: "GET",
//   success: function(data) {
//     console.log(data)
//   },
//   error: function(error) {
//     console.log(error)
//   }
// })

fetch("https://randomuser.me/api/")
  .then(function(response) {
    // console.log(response)
    return response.json()
  })
  .then(function(user) {
    console.log("user", user.results[0].name.first)
  })
  .catch(function() {
    console.log("algo falló")
  });


(async function load() {

  async function getData(url) {
    const response = await fetch(url)
    const data = await response.json()
    if (data.data.movie_count > 0) {
      return data
    } else {
      throw new Error("No se encontró ningun resultado")
    }
  }

  const $form = document.getElementById("form")
  const $home = document.getElementById("home")
  const $featuringContainer = document.getElementById("featuring")

  function setAttributes($element, attributes) {
    for (var attribute in attributes) {
      $element.setAttribute(attribute, attributes[attribute])
    }
  }

  const BASE_API = "https://yts.lt/api/v2/"

  function featuringTemplate(peli) {
    return (
      `
      <div class="featuring">
        <div class="featuring-image">
          <img src="${peli.medium_cover_image}" width="70" height="100" alt="">
        </div>
        <div class="featuring-content">
          <p class="featuring-title">Pelicula encontrada</p>
          <p class="featuring-album">${peli.title}</p>
        </div>
      </div>
      `
    )
  }

  $form.addEventListener("submit", async (event) => {
    event.preventDefault()
    $home.classList.add("search-active")
    const $loader = document.createElement("img")
    setAttributes($loader, {
      src: "src/images/loader.gif",
      height: 50,
      width: 50
    })

    $featuringContainer.append($loader)

    const data = new FormData($form)
    try {
      // const peli = await getData(`${BASE_API}list_movies.json?limit=1&query_term=${data.get("name")}`)
      const {
        data: {
          movies: pelis
        }
      } = await getData(`${BASE_API}list_movies.json?limit=1&query_term=${data.get("name")}`)
      const HTMLString = featuringTemplate(pelis[0]) //peli.data.movies[0]
      $featuringContainer.innerHTML = HTMLString
    } catch (error) {
      alert(error.message)
      $loader.remove()
      $home.classList.remove("search-active")
    }
  })

  function videoItemTemplate(movie, category) {
    return (
      `<div class="primaryPlaylistItem" data-id="${movie.id}" data-category="${category}">
        <div class="primaryPlaylistItem-image">
          <img src="${movie.medium_cover_image}">
        </div>
        <h4 class="primaryPlaylistItem-title">
          ${movie.title}
          </h4>
       </div>`
    )
  }

  function createTemplate(HTMLString) {
    const html = document.implementation.createHTMLDocument();
    html.body.innerHTML = HTMLString;
    return html.body.children[0]
  }

  function renderMovieList(list, $container, category) {
    $container.children[0].remove()
    list.forEach((movie) => {
      const HTMLString = videoItemTemplate(movie, category)
      const movieElement = createTemplate(HTMLString)
      $container.append(movieElement)
      const image = movieElement.querySelector("img")
      image.addEventListener("load", (event)=> {
        event.srcElement.classList.add("fadeIn")
      })
      addEventClick(movieElement)
    })
  }

  function addEventClick($element) {
    $element.addEventListener("click", () => {
      showModal($element)
    })
  }

  async function cacheExist(category) {
    const listName = `${category}List`
    const cacheList = window.localStorage.getItem(listName)
    if (cacheList) {
      return JSON.parse(cacheList)
    }
    const { data: { movies: data } } = await getData(`${BASE_API}list_movies.json?genre=${category}`)
    window.localStorage.setItem(listName, JSON.stringify(data))
    return data
  }

  // const { data: { movies: actionList } } = await getData(`${BASE_API}list_movies.json?genre=action`)
  const actionList = await cacheExist("action")
  // window.localStorage.setItem("actionList", JSON.stringify(actionList))
  const $actionContainer = document.getElementById("action")
  renderMovieList(actionList, $actionContainer, "action")

  const dramaList = await cacheExist("drama")
  const $dramaContainer = document.getElementById("drama")
  renderMovieList(dramaList, $dramaContainer, "drama")

  const animationList = await cacheExist("animation")
  const $animationContainer = document.getElementById("animation")
  renderMovieList(animationList, $animationContainer, "animation")

  const $modal = document.getElementById("modal")
  const $overlay = document.getElementById("overlay")
  const $hideModal = document.getElementById("hide-modal")

  const $modalTitle = $modal.querySelector("h1")
  const $modalImage = $modal.querySelector("img")
  const $modalDescription = $modal.querySelector("p")

  function findById(list, id) {
    return list.find(movie => movie.id === parseInt(id, 10))
  }

  function findMovie(id, category) {
    switch (category) {
      case "action": {
        return findById(actionList, id)
      }
      case "drama": {
        return findById(dramaList, id)
      }
      default:{
        return findById(animationList, id)
      }
    }
  }

  function showModal($element) {
    $overlay.classList.add("active")
    $modal.style.animation = "modalIn 0.8s forwards"
    const id = $element.dataset.id
    const category = $element.dataset.category
    const data = findMovie(id, category)
    $modalTitle.textContent = data.title
    $modalImage.setAttribute("src", data.medium_cover_image)
    $modalDescription.textContent = data.description_full
  }

  $hideModal.addEventListener("click", hideModal)
  function hideModal() {
    $overlay.classList.remove("active")
    $modal.style.animation = "modalOut 0.8s forwards"
  }

})()
