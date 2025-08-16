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

async function getRecipes() {
  if (ingredients.length === 0) {
    showError("Please add at least one ingredient");
    return;
  }

  const res = await fetch("http://localhost:8080/api/findRecipes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ingredients: ingredients,
    }),
  });

  if (!res.ok) {
    showError(`Server Error: ${res.status}`);
    return;
  }

  const recipes = res.json();
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

  console.log(recipes);
});

// Focus on input when page loads
window.addEventListener("load", () => {
  ingredientInput.focus();
});
