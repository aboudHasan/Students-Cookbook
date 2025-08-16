const ingredientInput = document.querySelector("#ingredientInput");
const ingredientsContainer = document.querySelector("#ingredientsContainer");
const findRecipesButton = document.querySelector("#findRecipesBtn");
const errorMessage = document.querySelector("#errorMessage");
const ingredients = [];

function updateIngredientsDisplay() {
  if (ingredients.length === 0) {
    ingredientsContainer.innerHTML =
      '<div class="placeholder-text">Your ingredients will appear here...</div>';
    return;
  }
  ingredientsContainer.innerHTML = "";
  ingredients.forEach((ingredient, index) => {
    const ingredientTag = document.createElement("div");
    ingredientTag.className = "ingredient-tag";
    ingredientTag.innerHTML = `
      <span>${ingredient}</span>
      <button
        class="remove-ingredient"
        onclick="removeIngredient(${index})"
        aria-label="Remove ${ingredient}"
      >×</button>
    `;
    ingredientsContainer.appendChild(ingredientTag);
  });
}

function showError(message) {
  ingredientInput.classList.add("error");
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
}

function clearError() {
  ingredientInput.classList.remove("error");
  errorMessage.style.display = "none";
}

function addIngredient() {
  const ingredient = ingredientInput.value.trim();
  const normalized = ingredient.toLowerCase();
  if (!ingredient) return;
  if (ingredients.includes(normalized)) {
    showError(`"${ingredient}" is already added.`);
    ingredientInput.value = "";
    return;
  }
  ingredients.push(normalized);
  updateIngredientsDisplay();
  ingredientInput.value = "";
  clearError();
}

function removeIngredient(index) {
  ingredients.splice(index, 1);
  updateIngredientsDisplay();
}

function createRecipeCard(recipe, missingType) {
  const card = document.createElement("div");
  card.className = "recipe-card";

  let statusMessage;
  let statusClass;

  switch (missingType) {
    case "perfect":
      statusMessage = "No missing ingredients";
      statusClass = "status-perfect";
      break;
    case "imperfect":
      statusMessage = "One missing ingredient";
      statusClass = "status-imperfect";
      break;
    case "bad":
      statusMessage = "Two or more missing ingredients";
      statusClass = "status-bad";
      break;
  }

  card.innerHTML = `
    <img src="${recipe.image}" alt="${recipe.title}" class="recipe-image" />
    <div class="recipe-info">
      <h3 class="recipe-title">${recipe.title}</h3>
      <div class="recipe-status ${statusClass}">${statusMessage}</div>
    </div>
  `;

  // Fetch only when clicked
  card.addEventListener("click", async () => {
    try {
      const recipeURL = await getRecipeURL(recipe.id);
      if (recipeURL) {
        window.open(recipeURL, "_blank");
      } else {
        showError("No recipe URL found.");
      }
    } catch (error) {
      console.error("Error opening recipe:", error);
      showError("Could not open recipe.");
    }
  });

  return card;
}

async function displayRecipes(data) {
  // Clear the ingredients container and replace with results
  ingredientsContainer.innerHTML = "";
  ingredientsContainer.className = "results-container";
  ingredientInput.setAttribute("disabled", "true");

  // Create the three columns (existing code stays the same)
  const resultsHTML = `
    <div class="results-columns">
      <div class="results-column perfect-matches">
        <div class="column-header perfect-header">
          <h2>Perfect Matches (${data.perfectMatchesCount})</h2>
        </div>
        <div class="recipes-list" id="perfectMatchesList">
          ${
            data.perfectMatchesCount === 0
              ? '<div class="no-recipes perfect-no-recipes">No perfect matches found</div>'
              : ""
          }
        </div>
      </div>
      
      <div class="results-column imperfect-matches">
        <div class="column-header imperfect-header">
          <h2>Close Matches (${data.imperfectMatchesCount})</h2>
        </div>
        <div class="recipes-list" id="imperfectMatchesList">
          ${
            data.imperfectMatchesCount === 0
              ? '<div class="no-recipes imperfect-no-recipes">No close matches found</div>'
              : ""
          }
        </div>
      </div>
      
      <div class="results-column bad-matches">
        <div class="column-header bad-header">
          <h2>Other Recipes (${data.badMatchesCount})</h2>
        </div>
        <div class="recipes-list" id="badMatchesList">
          ${
            data.badMatchesCount === 0
              ? '<div class="no-recipes bad-no-recipes">No other recipes found</div>'
              : ""
          }
        </div>
      </div>
    </div>
  `;

  ingredientsContainer.innerHTML = resultsHTML;

  // Populate perfect matches
  if (data.perfectMatchesCount > 0) {
    const perfectList = document.getElementById("perfectMatchesList");
    for (const recipe of data.perfectMatches) {
      const card = await createRecipeCard(recipe, "perfect");
      perfectList.appendChild(card);
    }
  }

  // Populate imperfect matches
  if (data.imperfectMatchesCount > 0) {
    const imperfectList = document.getElementById("imperfectMatchesList");
    for (const recipe of data.imperfectMatches) {
      const card = await createRecipeCard(recipe, "imperfect");
      imperfectList.appendChild(card);
    }
  }

  // Populate bad matches
  if (data.badMatchesCount > 0) {
    const badList = document.getElementById("badMatchesList");
    for (const recipe of data.badMatches) {
      const card = await createRecipeCard(recipe, "bad");
      badList.appendChild(card);
    }
  }
}

async function getRecipeURL(recipeID) {
  try {
    const res = await fetch(
      `https://students-cookbook.onrender.com/api/${recipeID}`
    );

    if (!res.ok) {
      throw new Error("Failed to get recipe URL");
    }

    const recipeInfo = await res.json();

    const recipeUrl = recipeInfo.sourceUrl || recipeInfo.spoonacularSourceUrl;

    return recipeUrl || null;
  } catch (error) {
    console.error("Error in getRecipeURL:", error);
    showError(error.message);
    return null;
  }
}

async function getRecipes() {
  if (ingredients.length === 0) {
    showError("Please add at least one ingredient");
    return;
  }
  const res = await fetch(
    "https://students-cookbook.onrender.com/api/findrecipes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ingredients: ingredients,
      }),
    }
  );
  if (!res.ok) {
    showError(`Server Error: ${res.status}`);
    return;
  }
  const recipes = await res.json();
  return recipes;
}

ingredientInput.addEventListener("input", clearError);
ingredientInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addIngredient();
  }
});

findRecipesButton.addEventListener("click", async () => {
  const recipes = await getRecipes();
  if (recipes) {
    await displayRecipes(recipes);
  }
});

// Focus on input when page loads
window.addEventListener("load", () => {
  ingredientInput.focus();
});
