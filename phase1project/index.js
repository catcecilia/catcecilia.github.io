//When HTML document has been completely parsed and all deferred scripts have been downloaded and executed, add functionality for webpage
addEventListener("DOMContentLoaded", (e) => {
  const html = document.documentElement;
  const mountingContainer = document.getElementById("mounts");
  const form = document.getElementById("search-form");
  const searchInput = document.getElementById("searching");
  const likedBtn = document.getElementById("liked");
  const ownedBtn = document.getElementById("owned");

  //Eventlistener for functionality of toggle button
  //Changing CSS styling to light and dark mode
  const toggleBtn = document.getElementById("toggle-mode-btn");
  toggleBtn.addEventListener("click", () => {
    html.setAttribute(
      "data-bs-theme",
      html.getAttribute("data-bs-theme") === "dark" ? "light" : "dark"
    );
    toggleBtn.innerText =
      html.getAttribute("data-bs-theme") === "dark"
        ? "Light Mode"
        : "Dark Mode";
  });

  //Display all items in API to div with id "mounts"

  //fetch API from https://ffxivcollect.com/api/mounts and create each card item that is appended to div
  fetch("https://ffxivcollect.com/api/mounts")
    .then((res) => res.json())
    .then((data) => {
      const arr = Array.from(data.results);
      arr.forEach((item) => {
        const divCard = document.createElement("div");
        const name = document.createElement("h2");
        const description = document.createElement("p");
        const image = document.createElement("img");
        const saveButton = document.createElement("button");
        const ownedButton = document.createElement("button");

        divCard.className = "card";

        name.innerText = item.name;
        divCard.appendChild(name);

        image.src = item.image;
        divCard.appendChild(image);

        description.innerText = item.description;
        divCard.appendChild(description);

        saveButton.textContent = "❤️";
        saveButton.id = item.id;
        saveButton.className = "btn btn-outline-danger";
        divCard.appendChild(saveButton);

        // Event listener for like button functionality
        saveButton.addEventListener("click", () => {
          saveButton.classList.toggle("btn-danger");
          divCard.classList.toggle("liked");
        });

        ownedButton.textContent = "Owned";
        ownedButton.className = "btn";
        ownedButton.id = item.id;
        divCard.appendChild(ownedButton);

        // Event listener for owned button functionality
        ownedButton.addEventListener("click", () => {
          divCard.classList.toggle("owned");
          ownedButton.classList.toggle("btn-secondary");
        });

        mountingContainer.appendChild(divCard);
      });
    })
    .catch((error) => console.log(error));

  //function for searching
  function search() {
    const divs = document.querySelectorAll(".card");
    const searchTerm = document
      .getElementById("searching")
      .value.trim()
      .toLowerCase();

    //display all potential results in case prior search was made
    const hiddenDivs = document.querySelectorAll(".hidden");
    hiddenDivs.forEach((div) => {
      div.classList.toggle("hidden");
    });

    divs.forEach((div) => {
      const headerName = div
        .querySelector("h2")
        .textContent.trim()
        .toLowerCase();
      //if search term does not match card item, card item is hidden and search term is not blank
      if (!headerName.includes(searchTerm) && searchTerm !== "") {
        div.classList.add("hidden");
      }
    });
  }

  //Event listener for functionality of search funciton when submitting
  //when user pastes text into search bar, user needs to click submit for results to show
  form.addEventListener("submit", (e) => {
    //Prevent form from reloading after submitting and obtaining search results

    e.preventDefault();
    search();
  });

  //event listener for functionality of search function when typing in search bar
  //when user types text into search bar, results will show
  searchInput.addEventListener("keyup", search);

  //Function for filtering search results to show only liked OR owned div cards
  function filter(value) {
    const allDivs = document.querySelectorAll(".card");
    allDivs.forEach((div) => {
      //if div doescontain value OR  hidden in class name
      if (div.classList.contains(value) || div.classList.contains("hidden")) {
        //do nothing
      } else {
        //add hidden class
        div.classList.add("hidden");
      }
    });
  }

  //Eventlistener for functionality of filtering search result for liked div cards
  likedBtn.addEventListener("click", function () {
    filter("liked");
  });

  //Eventlistener for functionality of filtering search result for owned div cars
  ownedBtn.addEventListener("click", function () {
    filter("owned");
  });

  //Eventlistener for functionality of the easter egg: spinning video game emoji when mouseover
  const spin = document.getElementById("spin");
  spin.addEventListener("mouseover", () => {
    spin.style.animation = "spin 2s linear";

    //remove animation after it is done
    setTimeout(() => {
      spin.style.animation = "none";
    }, 2000);
  });

  //Eventlistener for functionality of resetting filtering and search results
  const clear = document.getElementById("reset");
  clear.addEventListener("click", () => {
    const divs = document.querySelectorAll(".hidden");
    divs.forEach((div) => {
      //remove hidden class
      div.classList.remove("hidden");
    });
  });
});
